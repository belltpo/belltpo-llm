from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
import json

from .models import UserContact, ChatSession, FormSubmission
from .utils import JWTManager, SessionManager, ValidationUtils


class UserContactModelTest(TestCase):
    def setUp(self):
        self.user_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+1234567890',
            'country': 'US',
            'message': 'Test message'
        }

    def test_user_contact_creation(self):
        user = UserContact.objects.create(**self.user_data)
        self.assertEqual(user.name, 'John Doe')
        self.assertEqual(user.email, 'john@example.com')
        self.assertTrue(user.id)

    def test_user_contact_str_method(self):
        user = UserContact.objects.create(**self.user_data)
        expected_str = f"{user.name} ({user.email})"
        self.assertEqual(str(user), expected_str)


class JWTManagerTest(TestCase):
    def setUp(self):
        self.user_contact = UserContact.objects.create(
            name='Test User',
            email='test@example.com'
        )
        self.session_token = JWTManager.generate_session_token()

    def test_generate_session_token(self):
        token = JWTManager.generate_session_token()
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 10)

    def test_create_jwt_token(self):
        jwt_token = JWTManager.create_jwt_token(
            self.user_contact, 
            self.session_token
        )
        self.assertIsInstance(jwt_token, str)
        self.assertGreater(len(jwt_token), 50)

    def test_validate_jwt_token(self):
        jwt_token = JWTManager.create_jwt_token(
            self.user_contact, 
            self.session_token
        )
        payload, error = JWTManager.validate_jwt_token(jwt_token)
        self.assertIsNone(error)
        self.assertEqual(payload['email'], self.user_contact.email)


class ValidationUtilsTest(TestCase):
    def test_validate_email(self):
        self.assertTrue(ValidationUtils.validate_email('test@example.com'))
        self.assertTrue(ValidationUtils.validate_email('user+tag@domain.co.uk'))
        self.assertFalse(ValidationUtils.validate_email('invalid-email'))
        self.assertFalse(ValidationUtils.validate_email('test@'))

    def test_validate_phone(self):
        self.assertTrue(ValidationUtils.validate_phone('+1234567890'))
        self.assertTrue(ValidationUtils.validate_phone('123-456-7890'))
        self.assertTrue(ValidationUtils.validate_phone(''))  # Optional field
        self.assertFalse(ValidationUtils.validate_phone('123'))  # Too short

    def test_sanitize_input(self):
        self.assertEqual(ValidationUtils.sanitize_input('  test  '), 'test')
        self.assertEqual(
            ValidationUtils.sanitize_input('long text', max_length=4), 
            'long'
        )


class PrechatFormAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.valid_form_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+1234567890',
            'country': 'US',
            'message': 'Hello, I need help'
        }

    def test_submit_valid_form(self):
        response = self.client.post(
            reverse('api_submit_prechat'),
            data=json.dumps(self.valid_form_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('session_token', data['data'])
        self.assertIn('jwt_token', data['data'])

    def test_submit_invalid_form(self):
        invalid_data = {
            'name': '',  # Required field empty
            'email': 'invalid-email'
        }
        
        response = self.client.post(
            reverse('api_submit_prechat'),
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('errors', data)

    def test_validate_session_endpoint(self):
        # First create a session
        response = self.client.post(
            reverse('api_submit_prechat'),
            data=json.dumps(self.valid_form_data),
            content_type='application/json'
        )
        
        session_token = response.json()['data']['session_token']
        
        # Now validate the session
        validation_response = self.client.post(
            reverse('api_validate_session'),
            data=json.dumps({'session_token': session_token}),
            content_type='application/json'
        )
        
        self.assertEqual(validation_response.status_code, 200)
        data = validation_response.json()
        self.assertTrue(data['success'])

    def test_health_check_endpoint(self):
        response = self.client.get(reverse('api_health_check'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')


class SessionManagerTest(TestCase):
    def setUp(self):
        self.user_contact = UserContact.objects.create(
            name='Test User',
            email='test@example.com'
        )

    def test_create_chat_session(self):
        session = SessionManager.create_chat_session(self.user_contact)
        
        self.assertIsInstance(session, ChatSession)
        self.assertEqual(session.user_contact, self.user_contact)
        self.assertEqual(session.status, 'pending')
        self.assertTrue(session.session_token)
        self.assertTrue(session.jwt_token)

    def test_validate_session(self):
        session = SessionManager.create_chat_session(self.user_contact)
        
        validated_session, error = SessionManager.validate_session(
            session.session_token
        )
        
        self.assertIsNone(error)
        self.assertEqual(validated_session.id, session.id)

    def test_validate_expired_session(self):
        session = SessionManager.create_chat_session(self.user_contact)
        
        # Manually expire the session
        session.expires_at = timezone.now() - timedelta(hours=1)
        session.save()
        
        validated_session, error = SessionManager.validate_session(
            session.session_token
        )
        
        self.assertIsNone(validated_session)
        self.assertIn('expired', error.lower())


class FormViewTest(TestCase):
    def test_prechat_form_view(self):
        response = self.client.get(reverse('prechat_form'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Start Your Chat')

    def test_chat_redirect_view_without_token(self):
        response = self.client.get(reverse('chat_redirect'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Invalid or missing session token')

    def test_chat_redirect_view_with_valid_token(self):
        # Create a session first
        user_contact = UserContact.objects.create(
            name='Test User',
            email='test@example.com'
        )
        session = SessionManager.create_chat_session(user_contact)
        
        response = self.client.get(
            reverse('chat_redirect') + f'?token={session.session_token}'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Welcome, Test User!')

import { useContext } from "react";
import { AuthContext } from "@/AuthContext";

// interface IStore {
//   store: {
//     user: {
//       id: string;
//       username: string | null;
//       role: string;
//     };
//   };
// }

function useUser() {
  const context = useContext(AuthContext);

  return { ...context.store };
}

export { useUser };
export default useUser;

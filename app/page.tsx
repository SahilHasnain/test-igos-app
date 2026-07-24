import IgosClient from "./igos-client";
import { AuthGate } from "./auth-gate";

export default function Home() {
  return <AuthGate><IgosClient /></AuthGate>;
}

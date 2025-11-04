import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function UserSelect({ onSelect }) {
  const [email, setEmail] = useState("");
  const [foundUser, setFoundUser] = useState(null);

  const searchUser = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (!error && data) {
      setFoundUser(data);
    } else {
      setFoundUser(null);
      alert("User not found");
    }
  };

  return (
    <div>
      <input
        type="email"
        placeholder="Search user by email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={searchUser}>Find</button>

      {foundUser && (
        <div>
          <p>Found: {foundUser.email}</p>
          <button onClick={() => onSelect(foundUser)}>Chat</button>
        </div>
      )}
    </div>
  );
}

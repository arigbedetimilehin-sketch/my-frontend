// pages/trusted-contacts.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Link from "next/link";

// 💡 Using a custom hook for toast/notification is better, but we'll use a simple state here.
// 💡 We also use an object to track loading state for individual deletions.

export default function TrustedContacts() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(true); // Set to true initially
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // Tracks the ID of the contact being deleted
  const [error, setError] = useState(null); // To display fetch errors

  // 1) Get logged-in user
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Auth error:", error);
          setError("Failed to verify user session.");
          setLoading(false);
          return;
        }
        if (mounted) setUser(data.user ?? null);
      } catch (err) {
        console.error("getUser unexpected error:", err);
        setError("An unexpected error occurred during login check.");
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // 2) Fetch contacts when we have a user
  useEffect(() => {
    if (!user) {
      setLoading(false); // Stop loading if no user is found
      return;
    }

    const fetchContacts = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("trusted_contacts")
        .select("id, name, contact, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setLoading(false);
      if (error) {
        console.error("fetchContacts error:", error);
        setError("Failed to load contacts. Check RLS policy."); // Better user error
        return;
      }
      setContacts(data || []);
    };

    fetchContacts();
  }, [user]);

  // 3) Add a new contact
  const handleAdd = async (e) => {
    e?.preventDefault?.();
    if (!user) {
      alert("You must be logged in to add contacts.");
      return;
    }
    const trimmedName = name.trim();
    const trimmedContact = contact.trim();
    if (!trimmedName || !trimmedContact) {
      alert("Please fill both contact name and email/phone.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const payload = { user_id: user.id, name: trimmedName, contact: trimmedContact };

    const { data, error } = await supabase
      .from("trusted_contacts")
      .insert([payload])
      .select();

    setSubmitting(false);

    if (error) {
      console.error("add contact error:", error);
      setError("Failed to add contact: " + error.message);
      return;
    }

    // Prepend new contact(s) and clear inputs
    setContacts((prev) => [...(data || []), ...prev]);
    setName("");
    setContact("");
  };

  // 4) Delete a contact
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this trusted contact?")) return;

    setDeletingId(id); // Start loading state for this specific contact
    setError(null);
    
    const { error } = await supabase
      .from("trusted_contacts")
      .delete()
      .eq("id", id);

    setDeletingId(null); // Stop loading

    if (error) {
      console.error("delete contact error:", error);
      setError("Failed to delete contact: " + error.message);
      return;
    }

    // Filter out the deleted contact from state
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading && !user) {
    // Show a blank screen briefly while checking for the user
    return <div style={{ padding: 20 }}>Checking session...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 20, maxWidth: 700 }}>
        <h1>Trusted Contacts</h1>
        <p>You must be logged in to manage trusted contacts.</p>
        <p>
          <Link href="/login" style={{ marginRight: 10 }}>Login</Link> 
          or 
          <Link href="/signup" style={{ marginLeft: 10 }}>Sign up</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <h1>Trusted Contacts</h1>

      {/* Global Error Display */}
      {error && (
        <div style={{ color: "white", backgroundColor: "#c00", padding: 10, borderRadius: 4, marginBottom: 16 }}>
          Error: {error}
        </div>
      )}

      {/* Contact Add Form */}
      <form onSubmit={handleAdd} style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 4 }}>
        <h2 style={{marginTop: 0, fontSize: '1.2em'}}>Add New Contact</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name (e.g., Mom)"
            style={{ flex: 1, padding: 8, border: "1px solid #ddd" }}
            disabled={submitting}
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or phone number"
            style={{ flex: 1, padding: 8, border: "1px solid #ddd" }}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting || !name.trim() || !contact.trim()} 
            style={{ 
              padding: "8px 12px", 
              backgroundColor: "#0070f3", 
              color: "white", 
              border: "none", 
              borderRadius: 4, 
              cursor: "pointer" 
            }}
          >
            {submitting ? "Adding..." : "Add Contact"}
          </button>
        </div>
      </form>

      {/* Contact List */}
      <h2 style={{ fontSize: '1.2em', marginBottom: 16 }}>Your Trusted Contacts</h2>

      {loading ? (
        <p>Loading contacts...</p>
      ) : contacts.length === 0 ? (
        <p>You have no trusted contacts yet.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0, borderTop: "1px solid #eee" }}>
          {contacts.map((c) => (
            <li
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ color: "#555", fontSize: '0.9em' }}>{c.contact}</div>
              </div>
              <div>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id} // Disable while deleting
                  style={{ 
                    background: "transparent", 
                    border: "1px solid #c00", 
                    color: "#c00", 
                    cursor: "pointer", 
                    padding: "6px 10px", 
                    borderRadius: 4,
                  }}
                >
                  {deletingId === c.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
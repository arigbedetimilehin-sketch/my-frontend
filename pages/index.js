import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import Link from "next/link";
import ChatComponent from "../components/Chat";
import Head from "next/head";

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    getSession();

    // 🔍 Test connection
    supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error("Supabase connection error:", error.message);
        } else {
          console.log("Supabase connected ✅", data);
        }
      });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) {
    return (
      <>
        <Head>
          <title>EchoSignal Cloud</title>
        </Head>
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-purple-800 text-white">
          <h1 className="text-5xl font-bold mb-4">Tailwind is working! 🚀</h1>
          <p className="text-lg">
            <Link href="/login" className="underline hover:text-gray-200">
              Login
            </Link>{" "}
            |{" "}
            <Link href="/signup" className="underline hover:text-gray-200">
              Sign Up
            </Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>EchoSignal Cloud</title>
        <meta
          name="description"
          content="Secure messaging and safety features by Flameborn."
        />
        <meta charSet="UTF-8" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-800 text-white p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">EchoSignal Cloud</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <p className="mb-6">Welcome, {user.email}</p>

        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <ul className="space-y-2 mb-8">
          <li>
            <Link href="/deadman" className="hover:underline">
              Deadman Fingers
            </Link>
          </li>
          <li>
            <Link href="/panic" className="hover:underline">
              Panic Button
            </Link>
          </li>
          <li>
            <Link href="/trust-contacts" className="hover:underline">
              Trusted Contacts
            </Link>
          </li>
        </ul>

        {/* Chat under Deadman Finger */}
        <div className="bg-white text-black p-4 rounded-lg shadow-lg">
          <ChatComponent user={user} />
        </div>
      </div>
    </>
  );
}

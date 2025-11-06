import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import Link from "next/link";
import Head from "next/head";

// ✅ Exact folder + file names from your screenshot
import Chat from "../components/chat/chat";
import MessageList from "../components/chat/MessageList";
import ChatMessageInput from "../components/chat/ChatMessageInput";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    getSession();

    // Optional: quick Supabase connection test
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600">
        <p className="text-2xl font-semibold">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>EchoSignal Cloud</title>
        </Head>
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white text-center">
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">
            EchoSignal Cloud 🚀
          </h1>
          <p className="text-lg">
            <Link href="/login" className="underline hover:text-indigo-300">
              Login
            </Link>{" "}
            |{" "}
            <Link href="/signup" className="underline hover:text-pink-300">
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
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-800 to-indigo-900 text-white p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold drop-shadow-lg">🌌 EchoSignal Cloud</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg transition transform hover:scale-105 shadow-lg"
          >
            Logout
          </button>
        </div>

        {/* Welcome */}
        <p className="mb-6 text-lg font-light">
          Welcome back,{" "}
          <span className="font-semibold text-pink-300">{user.email}</span>
        </p>

        {/* Features */}
        <h2 className="text-2xl font-semibold mb-6 border-b border-white/30 pb-2">
          Features
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/deadman"
            className="p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition backdrop-blur-lg shadow-lg flex justify-center items-center text-xl font-medium"
          >
            🕒 Deadman Fingers
          </Link>

          <Link
            href="/panic"
            className="p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition backdrop-blur-lg shadow-lg flex justify-center items-center text-xl font-medium"
          >
            🚨 Panic Button
          </Link>

          <Link
            href="/trust-contacts"
            className="p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition backdrop-blur-lg shadow-lg flex justify-center items-center text-xl font-medium"
          >
            🤝 Trusted Contacts
          </Link>
        </div>

        {/* Chat Section */}
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-lg shadow-xl">
          <Chat user={user} />
        </div>
      </div>
    </>
  );
}

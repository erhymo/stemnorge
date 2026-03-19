import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

function Navigation() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("authUser");
    navigate("/");
  };
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex flex-wrap justify-between items-center shadow-md">
      <div className="flex space-x-4 mb-2 sm:mb-0">
        <Link to="/" className="hover:underline font-semibold">StemNorge</Link>
        <Link to="/vote" className="hover:underline">Stem</Link>
        <Link to="/forum" className="hover:underline">Forum</Link>
        <Link to="/result" className="hover:underline">Resultat</Link>
        <Link to="/admin" className="hover:underline">Admin</Link>
      </div>
      <div className="flex space-x-4">
        <Link to="/login" className="hover:underline">Logg inn</Link>
        <Link to="/register" className="hover:underline">Registrer</Link>
        <button onClick={handleLogout} className="hover:underline">Logg ut</button>
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-extrabold mb-4">Velkommen til StemNorge</h1>
      <p className="text-lg mb-6">En digital plattform for å delta i ukentlige samfunnsavstemninger.</p>
      <div className="space-x-4">
        <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded">Logg inn</Link>
        <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded">Registrer</Link>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [address, setAddress] = useState("");

  const handleSendCode = () => {
    alert("Engangskode sendt: 1234");
    setStep(2);
  };

  const handleVerifyCode = () => {
    if (code === "1234") {
      setStep(3);
    } else {
      alert("Feil kode. Prøv igjen.");
    }
  };

  const handleComplete = () => {
    const user = { phone, pin, name, birthdate, address };
    const stored = JSON.parse(localStorage.getItem("users")) || [];
    stored.push(user);
    localStorage.setItem("users", JSON.stringify(stored));
    alert("Registrering fullført!");
    navigate("/login");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Registrering</h2>

      {step === 1 && (
        <>
          <label>Telefonnummer:</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border mb-4"
            placeholder="+47..."
          />
          <button onClick={handleSendCode} className="bg-blue-600 text-white px-4 py-2">
            Send kode
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <label>Engangskode (skriv 1234):</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-2 border mb-4"
          />
          <button onClick={handleVerifyCode} className="bg-blue-600 text-white px-4 py-2">
            Verifiser kode
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <label>Lag 4-sifret PIN:</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={4}
            className="w-full p-2 border mb-4"
          />

          <label>Navn:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border mb-4"
          />

          <label>Fødselsdato:</label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="w-full p-2 border mb-4"
          />

          <label>Adresse:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border mb-4"
          />

          <button onClick={handleComplete} className="bg-green-600 text-white px-4 py-2 mt-2">
            Fullfør registrering
          </button>
        </>
      )}
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const match = storedUsers.find(
      (user) => user.phone === phone && user.pin === pin
    );

    if (match) {
      localStorage.setItem("authUser", JSON.stringify(match));
      navigate("/vote");
    } else {
      setError("Feil telefonnummer eller PIN.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Logg inn</h2>

      <label>Telefonnummer:</label>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full p-2 border mb-4"
        placeholder="+47..."
      />

      <label>PIN (4-sifret):</label>
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        maxLength={4}
        className="w-full p-2 border mb-4"
      />

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Logg inn
      </button>
    </div>
  );
}

function VotePage() {
  const [hasVoted, setHasVoted] = useState(false);
  const [vote, setVote] = useState(null);

  const handleVote = (choice) => {
    setVote(choice);
    setHasVoted(true);
    localStorage.setItem("userVote", JSON.stringify({ choice, date: new Date() }));
  };

  useEffect(() => {
    const existingVote = JSON.parse(localStorage.getItem("userVote"));
    if (existingVote) {
      setHasVoted(true);
      setVote(existingVote.choice);
    }
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ukens sak</h2>
      <p className="mb-4">Bør Norge innføre borgerlønn som en fast ordning for alle innbyggere?</p>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <strong>Argumenter for:</strong>
        <ul className="list-disc list-inside">
          <li>Trygghet og forutsigbarhet</li>
          <li>Redusert fattigdom</li>
          <li>Forenkling av velferdsordninger</li>
        </ul>
      </div>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <strong>Argumenter mot:</strong>
        <ul className="list-disc list-inside">
          <li>Kostbart for staten</li>
          <li>Kan svekke arbeidsmoralen</li>
          <li>Risiko for feilbruk</li>
        </ul>
      </div>

      {!hasVoted ? (
        <div className="flex gap-4">
          <button onClick={() => handleVote("for")} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded">Stem For</button>
          <button onClick={() => handleVote("mot")} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded">Stem Mot</button>
        </div>
      ) : (
        <p className="text-blue-600 font-semibold">Du har stemt: {vote.toUpperCase()}</p>
      )}
    </div>
  );
}

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedPosts = JSON.parse(localStorage.getItem("forumPosts")) || [];
    setPosts(storedPosts);
    const auth = JSON.parse(localStorage.getItem("authUser"));
    setUser(auth);
  }, []);

  const handlePost = () => {
    if (!message.trim()) return;
    const newPost = {
      name: user?.name || "Anonym",
      message,
      timestamp: new Date().toLocaleString(),
    };
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem("forumPosts", JSON.stringify(updatedPosts));
    setMessage("");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Diskusjonsforum</h2>

      {user ? (
        <>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border mb-4"
            placeholder="Skriv et innlegg..."
          />
          <button
            onClick={handlePost}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
          >
            Publiser
          </button>
        </>
      ) : (
        <p className="mb-6 text-gray-600">Du må være logget inn for å skrive innlegg.</p>
      )}

      {posts.map((post, idx) => (
        <div key={idx} className="border-b pb-4 mb-4">
          <p className="font-semibold">{post.name}</p>
          <p>{post.message}</p>
          <p className="text-sm text-gray-500">{post.timestamp}</p>
        </div>
      ))}
    </div>
  );
}

function ResultPage() {
  return <div className="p-6">[Resultater]</div>;
}

function AdminPage() {
  return <div className="p-6">[Adminpanel]</div>;
}

export default function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/vote" element={<VotePage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

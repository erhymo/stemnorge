// Stemmetype
export type Vote = {
  topic: string;
  choice: "for" | "mot";
  phone: string;
};

// Hent alle stemmer fra localStorage
function loadVotes(): Vote[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem("votes");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Legg til en stemme for en sak
export function addVote(topic: string, choice: "for" | "mot", phone: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const votes = loadVotes();
  if (votes.some((v) => v.topic === topic && v.phone === phone)) {
    return false;
  }
  votes.push({ topic, choice, phone });
  try {
    window.localStorage.setItem("votes", JSON.stringify(votes));
  } catch {}
  return true;
}

// Hent alle stemmer for en gitt sak
export function getVotesForTopic(topic: string): Vote[] {
  if (typeof window === "undefined") {
    return [];
  }
  const votes = loadVotes();
  return votes.filter((v) => v.topic === topic);
}
export type User = {
  name: string;
  phone: string;
  password: string;
};

let users: User[] = [];

export function addUser(user: User) {
  if (typeof window === "undefined") {
    return;
  }
  users.push(user);
  try {
    window.localStorage.setItem("users", JSON.stringify(users));
  } catch {}
}

export function loadUsers() {
  if (typeof window === "undefined") {
    users = [];
    return;
  }
  try {
    const stored = window.localStorage.getItem("users");
    users = stored ? JSON.parse(stored) : [];
  } catch {
    users = [];
  }
}

export function validateUser(phone: string, password: string) {
  loadUsers(); // 🔑 viktig: last brukere fra localStorage før sjekk
  return users.find((u) => u.phone === phone && u.password === password);
}

export function loginUser(user: User) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem("currentUser", JSON.stringify(user));
  } catch {}
}

export function logoutUser() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem("currentUser");
  } catch {}
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

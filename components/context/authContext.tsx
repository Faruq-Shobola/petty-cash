"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

interface AuthContextProps {
  user: User | null;
  role: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  role: null,
  loading: true,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser: User) => {
    const userEmail = currentUser.email;
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    const userDetails = querySnapshot.docs[0].data();
    setUser({
      ...currentUser,
      displayName: userDetails.displayName,
      docId: querySnapshot.docs[0].id,
    });
    setRole(userDetails.role);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        document.cookie = `token=${token}; path=/;`;

        await fetchUserData(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, role, loading, setLoading, fetchUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => useContext(AuthContext);

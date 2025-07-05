import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUserProfile(null);
      setLoading(false);
      return;
    }
    // Buscar igreja do usuário
    const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
    let foundIgrejaId = null;
    let userData = null;
    for (const docIgreja of igrejasSnapshot.docs) {
      const userDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
        foundIgrejaId = docIgreja.id;
        break;
      }
    }
    if (userData && foundIgrejaId) {
      // Buscar liderPrincipalId e logo do documento da igreja
      const igrejaDoc = await getDoc(doc(db, 'igrejas', foundIgrejaId));
      let liderPrincipalId = null;
      let logo = null;
      let nomeIgreja = null;
      if (igrejaDoc.exists()) {
        const igrejaData = igrejaDoc.data();
        liderPrincipalId = igrejaData.liderPrincipalId || null;
        logo = igrejaData.logo || null;
        nomeIgreja = igrejaData.nomeIgreja || null;
      }
      setUserProfile({ ...userData, igrejaId: foundIgrejaId, userId: currentUser.uid, liderPrincipalId, logo, nomeIgreja });
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProfile();
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchProfile();
    });
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 
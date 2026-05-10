"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import {
  clearPostRegisterProfilePending,
  getPostRegisterProfilePending,
} from "@/lib/onboarding-storage";

import { CompleteProfileModal } from "./complete-profile-modal";

export function PostRegisterProfileGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken, ready } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!ready || !user || !accessToken) return;
    if (getPostRegisterProfilePending()) {
      setShowModal(true);
    }
  }, [ready, user, accessToken]);

  function handleClose() {
    clearPostRegisterProfilePending();
    setShowModal(false);
  }

  return (
    <>
      {children}
      {showModal && user && accessToken ? (
        <CompleteProfileModal onClose={handleClose} />
      ) : null}
    </>
  );
}

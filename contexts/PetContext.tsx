import React, { createContext, useContext } from "react";
import { usePet } from "../hooks/usePet";

const PetContext = createContext<ReturnType<typeof usePet> | undefined>(
  undefined
);

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const petLogic = usePet();

  return <PetContext.Provider value={petLogic}>{children}</PetContext.Provider>;
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error("usePets must be used within a PetProvider");
  }
  return context;
};
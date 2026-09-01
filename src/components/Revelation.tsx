"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vrai dès que l'élément est entré dans l'écran — et pour de bon : on ne
 * repasse jamais à faux.
 *
 * Rien ne doit pouvoir rester caché. Un saut d'ancre ou une position de
 * défilement restaurée peut passer par-dessus un bloc sans que l'observateur
 * ne le voie jamais entrer : on vérifie donc aussi, au défilement, si le bloc
 * est déjà derrière nous. Le cas « moins d'animations » est traité en CSS :
 * l'état d'attente y est neutre, rien n'est masqué.
 */
export function useApparu(element: React.RefObject<HTMLElement | null>) {
  const [apparu, setApparu] = useState(false);

  useEffect(() => {
    const el = element.current;
    if (!el) return;

    let attente = 0;
    const arreter = () => {
      observateur.disconnect();
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
      if (attente) window.cancelAnimationFrame(attente);
    };

    const observateur = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setApparu(true);
          arreter();
        }
      },
      // On déclenche un peu avant que le bloc entre dans l'écran : sur un
      // défilement rapide, une apparition tardive laisserait une zone vide.
      { rootMargin: "0px 0px 15% 0px", threshold: 0 },
    );
    observateur.observe(el);

    // Filet de sécurité : le haut du bloc est déjà passé sous le bas de l'écran.
    const verifier = () => {
      attente = 0;
      if (el.getBoundingClientRect().top < window.innerHeight * 1.15) {
        setApparu(true);
        arreter();
      }
    };
    const auDefilement = () => {
      if (!attente) attente = window.requestAnimationFrame(verifier);
    };
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement);

    return arreter;
  }, [element]);

  return apparu;
}

/**
 * Fait apparaître son contenu quand il entre dans l'écran. L'effet est une
 * aide à la lecture, pas un décor : il ne se rejoue jamais et ne masque rien
 * de façon durable.
 */
export default function Revelation({
  children,
  delai = 0,
  className = "",
  as: Balise = "div",
}: {
  children: React.ReactNode;
  /** Décalage en secondes, pour échelonner une série de cartes. */
  delai?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const element = useRef<HTMLElement>(null);
  const vu = useApparu(element);

  return (
    <Balise
      ref={element as React.Ref<HTMLDivElement & HTMLLIElement>}
      data-vu={vu ? "oui" : "non"}
      style={vu && delai ? { transitionDelay: `${delai}s` } : undefined}
      className={`revelation ${className}`}
    >
      {children}
    </Balise>
  );
}

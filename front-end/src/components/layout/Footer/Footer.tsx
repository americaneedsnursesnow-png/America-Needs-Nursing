import { FooterColumns } from "./FooterColumns";
import { FooterSubscribe } from "./FooterSubscribe";

export function Footer() {
  return (
    <footer className="mt-auto w-full">
      <FooterColumns />
      <FooterSubscribe />

    </footer>
  );
}

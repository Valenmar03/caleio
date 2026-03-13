import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
};

const widthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function Sheet({
  open,
  onClose,
  children,
  width = "md",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let openRaf = 0;
    let closeTimeout: number | undefined;

    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";

      openRaf = window.requestAnimationFrame(() => {
        openRaf = window.requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      document.body.style.overflow = "";

      closeTimeout = window.setTimeout(() => {
        setMounted(false);
      }, 300);
    }

    return () => {
      if (openRaf) window.cancelAnimationFrame(openRaf);
      if (closeTimeout) window.clearTimeout(closeTimeout);
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (mounted) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [mounted, onClose]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full ${widthMap[width]} bg-white shadow-xl transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
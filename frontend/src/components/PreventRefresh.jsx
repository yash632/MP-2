import { useEffect } from "react";

const PreventRefresh = () => {
  useEffect(() => {
    const preventPullToRefresh = (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    const preventKeyboardRefresh = (event) => {
      if (event.key === "F5" || (event.ctrlKey && event.key === "r")) {
        event.preventDefault();
        console.log("Refresh Blocked!");
      }
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = ""; // Chrome ke liye zaroori hai
    };

    document.addEventListener("touchmove", preventPullToRefresh, { passive: false });
    window.addEventListener("keydown", preventKeyboardRefresh);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("touchmove", preventPullToRefresh);
      window.removeEventListener("keydown", preventKeyboardRefresh);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
};

export default PreventRefresh;

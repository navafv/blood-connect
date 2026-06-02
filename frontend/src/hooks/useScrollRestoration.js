/**
 * Scroll Restoration Utility
 * Ensures consistent top-of-page alignment across SPA transitions.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

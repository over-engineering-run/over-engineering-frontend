import clsx from "clsx";
import { Outlet } from "@remix-run/react";
import { Link } from "@remix-run/react";
import Logo from "~/components/Logo";
import Search from "~/components/Search";
import type { CommonProps } from "~/types";

type HeaderProps = CommonProps;
const Header = (props: HeaderProps) => (
  <header className={clsx("border-b bg-primary", props.className)}>
    <div className="relative flex items-center lg:ml-44">
      {/* Mobile */}
      <div className="w-full space-y-4 p-4 lg:hidden">
        <div className="flex justify-between">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <Search />
      </div>

      {/* Desktop */}
      <div
        className={clsx(
          "px-0 py-6",
          "w-full max-w-screen-md",
          "items-center",
          "hidden lg:flex"
        )}
      >
        <Link
          to="/"
          className="left-0 xl:absolute xl:-ml-2 xl:-translate-x-full"
        >
          <Logo />
        </Link>

        <Search />
      </div>
    </div>
  </header>
);

const Layout = () => (
  <main className="flex h-screen flex-col">
    <img
      className="fixed inset-0 opacity-60"
      src="https://resources.github.com/assets/images/dark-pixel-grid.svg"
      alt="background image"
      role="presentation"
    />

    <Header className="relative z-20" />

    <Outlet />
  </main>
);

export default Layout;

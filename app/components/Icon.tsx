import {
  HiOutlineMenuAlt4 as Menu,
  HiOutlineSearch as Search,
  HiOutlineBookOpen as Book,
} from "react-icons/hi";
import { MdClose as Close, MdOutlineHistory as History } from "react-icons/md";

import {
  HiOutlineChevronUp,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
} from "react-icons/hi";

import Lottie from "lottie-react";
import type { CommonProps } from "~/types";

const Chevron = {
  Up: HiOutlineChevronUp,
  Down: HiOutlineChevronDown,
  Left: HiOutlineChevronLeft,
  Right: HiOutlineChevronRight,
};

const Loading = (props: CommonProps) => (
  <Lottie animationData={require("~/assets/loading.json")} {...props} />
);

export default {
  Menu,
  Search,
  History,
  Close,
  Chevron,
  Book,
  Loading,
};

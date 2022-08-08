import {
  HiOutlineMenuAlt4 as Menu,
  HiOutlineSearch as Search,
  HiOutlineBookOpen as Book,
} from "react-icons/hi";
import { MdClose as Close } from "react-icons/md";

import {
  HiOutlineChevronUp,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
} from "react-icons/hi";

const Chevron = {
  Up: HiOutlineChevronUp,
  Down: HiOutlineChevronDown,
  Left: HiOutlineChevronLeft,
  Right: HiOutlineChevronRight,
};

import Lottie from "lottie-react";

const Loading = () => (
  <Lottie animationData={require("~/assets/loading.json")} />
);

export default {
  Menu,
  Search,
  Close,
  Chevron,
  Book,
  Loading,
};

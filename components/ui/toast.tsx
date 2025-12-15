"use client";

import * as React from "react";

type ToastProps = Record<string, never>;

type ToastActionElement = never;

function Noop({ children }: { children?: React.ReactNode }) {
  return children ? <>{children}</> : null;
}

const ToastProvider = Noop;
const ToastViewport = Noop;
const Toast = Noop;
const ToastTitle = Noop;
const ToastDescription = Noop;
const ToastClose = Noop;
const ToastAction = Noop;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  type ToastProps,
  type ToastActionElement,
};

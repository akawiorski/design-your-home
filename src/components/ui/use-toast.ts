import * as React from "react";

import type { ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 4;
const TOAST_REMOVE_DELAY = 7000;

type ToastVariant = ToastProps["variant"];

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: ToastVariant;
};

interface ToastState {
  toasts: ToasterToast[];
}

type ToastActionType =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const toastReducer = (state: ToastState, action: ToastActionType): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => {
          if (action.toastId && t.id !== action.toastId) {
            return t;
          }

          addToRemoveQueue(t.id);

          return {
            ...t,
            open: false,
          };
        }),
      };

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: ((state: ToastState) => void)[] = [];

let memoryState: ToastState = { toasts: [] };

function dispatch(action: ToastActionType) {
  memoryState = toastReducer(memoryState, action);
  for (const listener of listeners) {
    listener(memoryState);
  }
}

type ToastInput = Omit<ToasterToast, "id"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
};

function toast(input: ToastInput) {
  const id = genId();

  const update = (props: Partial<ToasterToast>) => dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...input,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss();
        }
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };

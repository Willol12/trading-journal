import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

// Slot mínimo: mescla props no único filho (ex.: <Button asChild><Link/></Button>)
export function Slot({
  children,
  className,
  ...props
}: { children?: React.ReactNode; className?: string } & Record<string, unknown>) {
  if (!isValidElement(children)) return null;
  const child = children as React.ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  return cloneElement(child, {
    ...props,
    ...childProps,
    className: cn(className, childProps.className as string | undefined),
  });
}

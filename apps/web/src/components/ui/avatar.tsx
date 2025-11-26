"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AvatarContextValue = {
  imageLoadingStatus: "loading" | "loaded" | "error"
  onImageLoadingStatusChange: (status: "loading" | "loaded" | "error") => void
}

const AvatarContext = React.createContext<AvatarContextValue | undefined>(undefined)

const useAvatarContext = () => {
  const context = React.useContext(AvatarContext)
  if (!context) {
    throw new Error("Avatar components must be used within an Avatar")
  }
  return context
}

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<
    "loading" | "loaded" | "error"
  >("loading")

  return (
    <AvatarContext.Provider
      value={{ imageLoadingStatus, onImageLoadingStatusChange: setImageLoadingStatus }}
    >
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, ...props }, ref) => {
  const { onImageLoadingStatusChange } = useAvatarContext()

  React.useLayoutEffect(() => {
    if (!src || typeof src !== 'string') {
      onImageLoadingStatusChange("error")
      return
    }
    const image = new Image()
    image.src = src
    image.onload = () => onImageLoadingStatusChange("loaded")
    image.onerror = () => onImageLoadingStatusChange("error")
    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [src, onImageLoadingStatusChange])

  return (
    <img
      ref={ref}
      src={src}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { imageLoadingStatus } = useAvatarContext()

  if (imageLoadingStatus === "loaded") {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }

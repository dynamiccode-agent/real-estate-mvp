"use client";

import Image from "next/image";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { PointerEvent, ReactNode, useEffect, useRef, useState } from "react";

type PropertyImageSwiperProps = {
  images: string[];
  title: string;
  suburb: string;
  priority: boolean;
  children?: ReactNode;
};

export default function PropertyImageSwiper({ images, title, suburb, priority, children }: PropertyImageSwiperProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [nearViewport, setNearViewport] = useState(priority);
  const mediaRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || nearViewport) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNearViewport(true);
      observer.disconnect();
    }, { rootMargin: "700px 0px" });
    observer.observe(media);
    return () => observer.disconnect();
  }, [nearViewport]);

  useEffect(() => {
    if (!nearViewport) return;
    [imageIndex + 1, imageIndex + 2, imageIndex - 1]
      .filter((index) => index >= 0 && index < images.length)
      .forEach((index) => {
        const preload = new window.Image();
        preload.decoding = "async";
        preload.src = images[index];
        void preload.decode().catch(() => undefined);
      });
  }, [imageIndex, images, nearViewport]);

  function goTo(index: number) {
    setImageIndex(Math.max(0, Math.min(images.length - 1, index)));
    setDragX(0);
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    setDragX(event.clientX - startX.current);
  }

  function pointerUp() {
    if (dragX < -45) goTo(imageIndex + 1);
    else if (dragX > 45) goTo(imageIndex - 1);
    else setDragX(0);
    startX.current = null;
  }

  return (
    <div ref={mediaRef} className="property-media" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
      <div className="property-photo" style={{ transform: `translateX(${dragX * .08}px)` }}>
        <Image unoptimized src={images[imageIndex]} alt={`${title}, ${suburb} — photograph ${imageIndex + 1}`} fill priority={priority} sizes="(max-width: 760px) 100vw, (max-width: 1200px) 60vw, 720px" />
      </div>
      <div className="media-shade" />
      <button className="photo-arrow left" disabled={imageIndex === 0} aria-label="Previous photograph" onClick={() => goTo(imageIndex - 1)}><CaretLeft weight="bold" /></button>
      <button className="photo-arrow right" disabled={imageIndex === images.length - 1} aria-label="Next photograph" onClick={() => goTo(imageIndex + 1)}><CaretRight weight="bold" /></button>
      {children}
      <span className="photo-count" role="status" aria-label={`Photograph ${imageIndex + 1} of ${images.length}`}>{imageIndex + 1} / {images.length}</span>
    </div>
  );
}

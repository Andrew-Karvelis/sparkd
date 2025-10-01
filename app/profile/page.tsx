"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Sparkles, LogOut, CreditCard, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface GalleryItem {
  id: string;
  url: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState<string>("");
  const [credits, setCredits] = useState<number>(0);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setEmail(data.email);
        setCredits(data.credits);
        setGallery(data.gallery);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleBuyCredits = () => {
    router.push("/pricing");
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGallery((prev) => prev.filter((img) => img.id !== id));
      } else {
        console.error("Failed to delete image");
      }
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  };

  const handleDeleteClick = (id: string) => {
    setImageToDelete(id);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-primary-500" />
          <span className="text-2xl font-bold text-gray-900">Sparkd</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      {/* Profile Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

        {/* Account Overview */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Account Overview
          </h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <>
              <p className="text-gray-700">
                Email: <span className="font-medium">{email}</span>
              </p>
              <p className="text-gray-700 mt-2">
                Credits: <span className="font-medium">{credits}</span>
              </p>
              <Button onClick={handleBuyCredits} className="mt-4">
                <CreditCard className="h-4 w-4 mr-2" /> Buy More Credits
              </Button>
            </>
          )}
        </div>

        {/* Gallery */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            My Gallery
          </h2>
          {loading ? (
            <p className="text-gray-500">Loading gallery...</p>
          ) : gallery.length === 0 ? (
            <p className="text-gray-500">No generated images yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {gallery.map((img) => (
                <div
                  key={img.id}
                  className="relative bg-gray-100 rounded-lg overflow-hidden shadow cursor-pointer"
                >
                  <Image
                    src={img.url}
                    alt={`Generated ${img.id}`}
                    width={400}
                    height={400}
                    className="object-cover w-full h-56"
                    onClick={() => setSelectedImage(img.url)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(img.id) }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded p-1 hover:bg-black/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-500 text-center py-2">
                    {img.createdAt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <p className="mb-4 font-medium">
              Are you sure you wish to delete this image from your gallery?
            </p>
            <div className="flex justify-around">
              <Button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={async () => {
                  if (imageToDelete) await handleDeleteImage(imageToDelete);
                  setModalOpen(false);
                  setImageToDelete(null);
                }}
              >
                Yes
              </Button>
              <Button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => {
                  setModalOpen(false);
                  setImageToDelete(null);
                }}
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <Image
            src={selectedImage}
            alt="Full screen image"
            width={1200}
            height={1200}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2025 Sparkd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

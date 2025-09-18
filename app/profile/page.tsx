// src/app/profile/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Sparkles, LogOut, CreditCard, Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation"

interface GalleryItem {
    id: number;
    url: string;
    createdAt: string;
}

export default function ProfilePage() {
    const router = useRouter()
    const [credits, setCredits] = useState<number>(5);
    const [gallery, setGallery] = useState<GalleryItem[]>([
        {
            id: 1,
            url: "/assets/demo1.png",
            createdAt: "2025-09-12",
        },
        {
            id: 2,
            url: "/assets/demo2.png",
            createdAt: "2025-09-13",
        },
    ]);

    const handleBuyCredits = () => {
        router.push("/pricing")
    };

    const handleDeleteImage = (id: number) => {
        setGallery((prev) => prev.filter((img) => img.id !== id));
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
                    <Link href="/">
                        <Button variant="outline">Home</Button>
                    </Link>
                    <Button variant="outline">
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
                    <p className="text-gray-700">
                        Email: <span className="font-medium">user@example.com</span>
                    </p>
                    <p className="text-gray-700 mt-2">
                        Credits: <span className="font-medium">{credits}</span>
                    </p>
                    <Button
                        onClick={handleBuyCredits}
                        className="mt-4"
                    >
                        <CreditCard className="h-4 w-4 mr-2" /> Buy More Credits
                    </Button>
                </div>

                {/* Gallery */}
                <div className="bg-white rounded-xl shadow p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                        My Gallery
                    </h2>
                    {gallery.length === 0 ? (
                        <p className="text-gray-500">No generated images yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {gallery.map((img) => (
                                <div
                                    key={img.id}
                                    className="relative bg-gray-100 rounded-lg overflow-hidden shadow"
                                >
                                    <Image
                                        src={img.url}
                                        alt={`Generated ${img.id}`}
                                        width={400}
                                        height={400}
                                        className="object-cover w-full h-56"
                                    />
                                    <button
                                        onClick={() => handleDeleteImage(img.id)}
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

                {/* Settings */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                        Account Settings
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" /> Change Password
                        </Button>
                        <Button variant="outline">
                            <LogOut className="h-4 w-4 mr-2" /> Logout
                        </Button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-8 mt-20">
                <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
                    <p>&copy; 2025 Sparkd. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

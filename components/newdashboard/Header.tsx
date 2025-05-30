"use client";

import { MobileMenu } from "@/components/mobile-menu"; // Ini akan memanggil MobileMenu yang sudah diedit
import { SearchComponent } from "@/components/search/search-component";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, Heart, LogOut, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

import PocketBase, { type RecordModel, ClientResponseError } from "pocketbase";

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.evoptech.com");

export function Header() {
    const { theme } = useTheme();
    const [currentUser, setCurrentUser] = useState<RecordModel | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isHeartHovered, setIsHeartHovered] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false); // Tetap ada jika Anda ingin menggunakannya

    const fetchNotificationCount = useCallback(async (userId: string, signal: AbortSignal) => {
        setLoadingNotifications(true);
        let totalNotifications = 0;
        try {
            const invitationsResult = await pb.collection('danusin_session_invitation').getList(1, 1, {
                filter: `danuser_invited = "${userId}" && status = "waiting"`,
                $autoCancel: false,
                signal: signal,
            });
            if (!signal.aborted) {
                totalNotifications += invitationsResult.totalItems;
            }

            const adminRequestsResult = await pb.collection('danusin_session_request').getList(1, 1, {
                filter: `danuser_admin ~ "${userId}" && status = "waiting"`,
                $autoCancel: false,
                signal: signal,
            });
            if (!signal.aborted) {
                totalNotifications += adminRequestsResult.totalItems;
            }

            if (!signal.aborted) {
                setNotificationCount(totalNotifications);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError' && !(error instanceof ClientResponseError && error.status === 0)) {
                console.error("Error fetching notification count:", error);
            }
        } finally {
            if (!signal.aborted) {
                setLoadingNotifications(false);
            }
        }
    }, []);

    useEffect(() => {
        let abortController = new AbortController();

        const handleAuthChange = (model: RecordModel | null) => {
            setCurrentUser(model);
            if (model && model.avatar && model.id && model.collectionId) {
                try {
                    const url = pb.files.getUrl(model, model.avatar, { thumb: "100x100" });
                    setAvatarUrl(url);
                } catch (error) {
                    console.error("Error getting avatar URL:", error);
                    setAvatarUrl(null);
                }
                abortController.abort(); 
                abortController = new AbortController();
                fetchNotificationCount(model.id, abortController.signal);

            } else {
                setAvatarUrl(null);
                setNotificationCount(0);
            }
        };

        handleAuthChange(pb.authStore.model as RecordModel | null);
        const unsubscribe = pb.authStore.onChange((token, model) => {
            handleAuthChange(model as RecordModel | null);
        });

        return () => {
            unsubscribe();
            abortController.abort();
        };
    }, [fetchNotificationCount]);

    const handleLogout = () => {
        pb.authStore.clear();
        window.location.href = "/login";
    };

    const logoPath = theme === "dark" ? "/logo-danusin-hijau.png" : "/logo-danusin-putih.png";

    return (
        <header className="sticky top-0 z-50 bg-emerald-500/80 backdrop-blur-md border-b border-emerald-600/50 dark:bg-zinc-900/80 dark:border-b dark:border-zinc-800/50 transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Left Section */}
                    <div className="flex items-center">
                        {/* Props `notificationCount` sekarang valid jika MobileMenuProps sudah diupdate */}
                        <MobileMenu currentUser={currentUser} avatarUrl={avatarUrl} notificationCount={notificationCount} />
                        <div className="hidden md:flex items-center md:gap-2 lg:gap-3 xl:gap-4">
                            <Link href="/" className="flex items-center gap-2 group" aria-label="App Home">
                                <div className="relative w-9 h-9 overflow-hidden rounded-full group-hover:scale-105 transition-transform duration-300">
                                    <Image
                                        src={logoPath || "/placeholder.svg"}
                                        alt="App Logo"
                                        width={36}
                                        height={36}
                                        sizes="36px"
                                        className="w-9 h-9 group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <span className="font-bold text-lg sm:text-xl tracking-tight transition-colors duration-300 text-white group-hover:text-emerald-100 dark:text-white dark:group-hover:text-emerald-400">
                                    DANUSIN
                                </span>
                            </Link>
                            <nav className="flex items-center md:ml-4 lg:ml-5 md:space-x-2 lg:space-x-4 xl:space-x-6">
                                {["About", "Features", "Contact"].map((item) => (
                                    <Link
                                        key={item}
                                        href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                                        className="font-medium text-sm transition-colors duration-300 relative text-white hover:text-emerald-100 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-emerald-100 after:transition-all after:duration-300 dark:text-white dark:hover:text-emerald-400 dark:after:bg-emerald-400"
                                    >
                                        {item}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href={currentUser ? "/dashboard/favorites/products" : "/login"}
                            aria-label="Favorites"
                            onMouseEnter={() => setIsHeartHovered(true)}
                            onMouseLeave={() => setIsHeartHovered(false)}
                            className="p-2 rounded-full text-white hover:bg-emerald-400/20 dark:text-white dark:hover:bg-zinc-700/60 transition-colors duration-200"
                        >
                            <Heart
                                className={`w-5 h-5 transition-all ${isHeartHovered ? "stroke-rose-400 dark:stroke-rose-500 fill-rose-500/10" : "stroke-current"}`}
                            />
                        </Link>

                        <SearchComponent />
                        <ThemeToggle />

                        {currentUser ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="User menu"
                                        className="flex items-center gap-1 p-0.5 pr-1 rounded-full transition-colors duration-200 hover:bg-emerald-400/20 dark:hover:bg-zinc-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-zinc-900 dark:focus-visible:ring-emerald-500"
                                    >
                                        <Avatar className="h-8 w-8 border border-emerald-500/50 dark:border-zinc-600/80">
                                            <AvatarImage
                                                src={avatarUrl || undefined}
                                                alt={currentUser?.name || currentUser?.username || "User"}
                                                sizes="32px"
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs font-semibold text-white">
                                                {(currentUser.username || currentUser.name || "U").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <ChevronDown className="h-4 w-4 text-emerald-100/70 dark:text-zinc-400 transition-colors duration-200" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56 bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 shadow-lg rounded-md mt-2 p-1 z-[51]"
                                >
                                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
                                        Signed in as <br />
                                        <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">
                                            {currentUser.email}
                                        </span>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-neutral-200 dark:bg-zinc-700 h-px my-1" />
                                    <DropdownMenuItem asChild className="focus:!bg-neutral-100 dark:focus:!bg-zinc-700/50 rounded-sm">
                                        <Link
                                            href="/dashboard/profile"
                                            className="flex items-center justify-between gap-2.5 px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer w-full"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <UserCircle2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                                <span>My Profile</span>
                                            </div>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="focus:!bg-neutral-100 dark:focus:!bg-zinc-700/50 rounded-sm">
                                        <Link
                                            href="/dashboard/notification"
                                            className="flex items-center justify-between gap-2.5 px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer w-full"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Bell className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                                <span>Notifications</span>
                                            </div>
                                            {notificationCount > 0 && (
                                                <Badge variant="destructive" className="h-5 px-1.5 text-xs rounded-full">
                                                    {notificationCount > 99 ? "99+" : notificationCount}
                                                </Badge>
                                            )}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-neutral-200 dark:bg-zinc-700 h-px my-1" />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-red-600 dark:text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10 focus:!bg-red-50 dark:focus:!bg-red-500/10 rounded-sm cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" /> <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/login">
                                <button className="px-3 py-1.5 text-sm font-medium text-white hover:text-emerald-100 dark:text-white dark:hover:text-emerald-300">
                                    Login
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
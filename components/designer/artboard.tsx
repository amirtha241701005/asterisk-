"use client";

import {
  Home,
  Search,
  ShoppingBag,
  User,
  CalendarDays,
  Map,
  Compass,
  Settings,
  ListChecks,
  BookOpen,
  Bell,
  Heart,
  Folder,
  LayoutDashboard,
  CircleUserRound,
  MapPin,
  Plane,
  Wallet,
  Users,
  MessageCircle,
  Star,
} from "lucide-react";

import { getActiveScreen } from "@/lib/ai/schemas";
import { resolveTokens } from "@/lib/design/tokens";

import { DesignRenderer } from "./design-renderer";
import { EditorOverlay } from "./editor-overlay";
import { useDesigner } from "./designer-context";

function stripGeneratedNavigation(
  components: any[],
) {
  return components.filter(
    (component) =>
      component.type !== "navigation" &&
      component.type !== "tabbar",
  );
}

type NavItem = {
  screenId: string;
  label: string;
  icon: typeof Home;
};

function getScreenLabel(screen: any) {
  const raw =
    screen?.name ||
    screen?.title ||
    screen?.label ||
    screen?.id ||
    "Screen";

  const cleaned = String(raw)
    .replace(/^screen[-_\s]*/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!cleaned) {
    return "Screen";
  }

  return cleaned
    .split(" ")
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function getNavigationLabel(screen: any) {
  const label = getScreenLabel(screen);

  const normalized = label.toLowerCase();

  if (
    normalized.includes("dashboard") ||
    normalized === "home" ||
    normalized.includes("home")
  ) {
    return "Home";
  }

  if (
    normalized.includes("profile") ||
    normalized.includes("account") ||
    normalized.includes("settings")
  ) {
    return normalized.includes("settings")
      ? "Settings"
      : "Profile";
  }

  if (
    normalized.includes("search") ||
    normalized.includes("explore") ||
    normalized.includes("discover")
  ) {
    return normalized.includes("search")
      ? "Search"
      : "Explore";
  }

  if (
    normalized.includes("order") ||
    normalized.includes("purchase") ||
    normalized.includes("booking")
  ) {
    return normalized.includes("booking")
      ? "Bookings"
      : "Orders";
  }

  if (
    normalized.includes("assignment") ||
    normalized.includes("task") ||
    normalized.includes("todo")
  ) {
    return "Assignments";
  }

  if (
    normalized.includes("event") ||
    normalized.includes("calendar")
  ) {
    return "Events";
  }

  if (
    normalized.includes("itinerary") ||
    normalized.includes("trip")
  ) {
    return "Itinerary";
  }

  if (
    normalized.includes("saved") ||
    normalized.includes("favorite") ||
    normalized.includes("wishlist")
  ) {
    return "Saved";
  }

  return label.length > 12
    ? label.slice(0, 12)
    : label;
}

function getNavigationIcon(
  screen: any,
) {
  const label = getScreenLabel(screen).toLowerCase();

  if (
    label.includes("dashboard") ||
    label === "home" ||
    label.includes("home")
  ) {
    return Home;
  }

  if (
    label.includes("search") ||
    label.includes("explore") ||
    label.includes("discover")
  ) {
    return label.includes("search")
      ? Search
      : Compass;
  }

  if (
    label.includes("order") ||
    label.includes("purchase")
  ) {
    return ShoppingBag;
  }

  if (
    label.includes("profile") ||
    label.includes("account")
  ) {
    return User;
  }

  if (
    label.includes("setting")
  ) {
    return Settings;
  }

  if (
    label.includes("assignment") ||
    label.includes("task") ||
    label.includes("todo")
  ) {
    return ListChecks;
  }

  if (
    label.includes("event") ||
    label.includes("calendar")
  ) {
    return CalendarDays;
  }

  if (
    label.includes("itinerary")
  ) {
    return Map;
  }

  if (
    label.includes("trip")
  ) {
    return Plane;
  }

  if (
    label.includes("saved") ||
    label.includes("favorite") ||
    label.includes("wishlist")
  ) {
    return Heart;
  }

  if (
    label.includes("book")
  ) {
    return BookOpen;
  }

  if (
    label.includes("notification")
  ) {
    return Bell;
  }

  if (
    label.includes("folder") ||
    label.includes("project")
  ) {
    return Folder;
  }

  if (
    label.includes("map") ||
    label.includes("location")
  ) {
    return MapPin;
  }

  if (
    label.includes("wallet") ||
    label.includes("budget") ||
    label.includes("expense")
  ) {
    return Wallet;
  }

  if (
    label.includes("community") ||
    label.includes("people") ||
    label.includes("friend")
  ) {
    return Users;
  }

  if (
    label.includes("message") ||
    label.includes("chat")
  ) {
    return MessageCircle;
  }

  if (
    label.includes("rating") ||
    label.includes("review")
  ) {
    return Star;
  }

  return LayoutDashboard;
}

function buildNavigationItems(
  screens: any[],
): NavItem[] {
  if (!screens?.length) {
    return [];
  }

  /*
   * The navigation is now derived from the actual
   * generated screens.
   *
   * This means:
   *
   * screens:
   *   Home
   *   Assignments
   *   Events
   *   Profile
   *
   * produces:
   *
   *   Home → Home
   *   Assignments → Assignments
   *   Events → Events
   *   Profile → Profile
   *
   * No hardcoded Search/Orders routes.
   */

  return screens
    .slice(0, 4)
    .map((screen) => ({
      screenId: screen.id,
      label: getNavigationLabel(screen),
      icon: getNavigationIcon(screen),
    }));
}

function GeneratedBottomNavigation({
  screens,
  activeScreenId,
  onSelect,
}: {
  screens: any[];
  activeScreenId: string;
  onSelect: (screenId: string) => void;
}) {
  const items = buildNavigationItems(
    screens,
  );

  if (items.length < 2) {
    return null;
  }

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 flex h-16 items-center justify-around rounded-2xl border border-black/5 bg-white px-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      {items.map((item) => {
        const Icon = item.icon;

        const active =
          item.screenId === activeScreenId;

        return (
          <button
            key={item.screenId}
            type="button"
            title={`Go to ${item.label}`}
            aria-label={`Go to ${item.label}`}
            onClick={() =>
              onSelect(item.screenId)
            }
            className={`flex min-w-[58px] max-w-[78px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition ${active
              ? "text-violet-600"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <Icon
              size={17}
              strokeWidth={
                active ? 2.2 : 1.7
              }
            />

            <span className="max-w-full truncate text-[9px] font-medium">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyPhoneArtboard() {
  return (
    <div className="relative h-[720px] w-[360px] rounded-[44px] border-[8px] border-[#08090f] bg-[#08090f] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#10111c]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(124,92,255,0.10),transparent_45%)]" />

        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#08090f]" />

        <div className="relative flex h-full items-center justify-center px-8 text-center">
          <div className="mt-2">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <span className="text-xl font-semibold">
                A
              </span>
            </div>

            <h3 className="text-sm font-semibold text-white">
              Your canvas is ready
            </h3>

            <p className="mx-auto mt-2 max-w-[230px] text-xs leading-5 text-white/40">
              Describe your product and generate a UI to start designing.
            </p>
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function LoadingPhoneArtboard() {
  return (
    <div className="relative h-[720px] w-[360px] rounded-[44px] border-[8px] border-[#08090f] bg-[#08090f] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[34px] bg-[#10111c]">
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#08090f]" />

        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />

          <p className="text-xs text-white/45">
            Building your interface…
          </p>
        </div>

        <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function ErrorPhoneArtboard({
  error,
}: {
  error: string;
}) {
  return (
    <div className="relative h-[720px] w-[360px] rounded-[44px] border-[8px] border-[#08090f] bg-[#08090f] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[34px] bg-[#10111c] px-8 text-center">
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#08090f]" />

        <div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
            !
          </div>

          <p className="text-sm font-semibold text-white">
            Something went wrong
          </p>

          <p className="mt-2 text-xs leading-5 text-red-200/60">
            {error}
          </p>
        </div>

        <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

export function Artboard() {
  const {
    screens,
    activeScreenId,
    generated,
    designData,
    device,
    selectedLayerId,
    selectLayer,
    selectScreen,
    previewMode,
    isLoading,
    error,
  } = useDesigner();

  if (!generated) {
    return <EmptyPhoneArtboard />;
  }

  if (isLoading || !designData) {
    return <LoadingPhoneArtboard />;
  }

  if (error) {
    return <ErrorPhoneArtboard error={error} />;
  }

  const currentScreen = getActiveScreen(
    designData,
    activeScreenId,
  );

  if (!currentScreen) {
    return <EmptyPhoneArtboard />;
  }

  const dimensions =
    device === "mobile"
      ? {
        width: 360,
        height: 720,
        radius: 44,
        border: 8,
      }
      : device === "tablet"
        ? {
          width: 600,
          height: 820,
          radius: 34,
          border: 0,
        }
        : {
          width: 920,
          height: 680,
          radius: 26,
          border: 0,
        };

  const tokens = resolveTokens(
    designData,
    currentScreen,
  );

  const editorComponents =
    currentScreen.components.filter(
      (component) =>
        component.id.startsWith("editor-") ||
        component.props?.editor === true,
    );

  const generatedComponents =
    stripGeneratedNavigation(
      currentScreen.components,
    ).filter(
      (component) =>
        !(
          component.id.startsWith("editor-") ||
          component.props?.editor === true
        ),
    );

  const renderScreen = {
    ...currentScreen,
    components: generatedComponents,
  };

  const isMobile = device === "mobile";

  return (
    <div
      className={`relative ${isMobile
        ? "rounded-[44px] border-[8px] border-[#08090f] bg-[#08090f] shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
        : "rounded-[26px] border border-white/10 bg-[#08090f] shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
        }`}
      style={{
        width: dimensions.width,
        minHeight: dimensions.height,
      }}
    >
      <div
        className={`relative overflow-hidden ${isMobile
          ? "rounded-[34px]"
          : "rounded-[25px]"
          }`}
        style={{
          width: isMobile
            ? dimensions.width -
            dimensions.border * 2
            : dimensions.width,
          minHeight: isMobile
            ? dimensions.height -
            dimensions.border * 2
            : dimensions.height,
        }}
      >
        {isMobile && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-[60] h-5 w-24 -translate-x-1/2 rounded-full bg-[#08090f]" />
        )}

        <DesignRenderer
          screen={renderScreen}
          tokens={tokens}
          selectedId={
            previewMode
              ? null
              : selectedLayerId
          }
          onSelect={
            previewMode
              ? undefined
              : selectLayer
          }
        />

        <EditorOverlay
          components={editorComponents}
          artboardWidth={
            isMobile
              ? dimensions.width -
              dimensions.border * 2
              : dimensions.width
          }
          artboardHeight={
            isMobile
              ? dimensions.height -
              dimensions.border * 2
              : dimensions.height
          }
        />

        {isMobile && (
          <GeneratedBottomNavigation
            screens={screens}
            activeScreenId={activeScreenId}
            onSelect={(screenId) => {
              /*
               * IMPORTANT:
               * Navigation now uses the actual screen ID.
               *
               * There is no:
               *   index 1 = Search
               *   index 2 = Orders
               *
               * anymore.
               *
               * Search can only open the screen whose
               * ID belongs to the Search screen.
               */
              selectScreen(screenId);
            }}
          />
        )}

        {isMobile && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-[60] h-1 w-24 -translate-x-1/2 rounded-full bg-black/30" />
        )}
      </div>
    </div>
  );
}
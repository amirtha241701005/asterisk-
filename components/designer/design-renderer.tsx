"use client";

import type { ReactNode } from "react";

import type {
  ComponentStateName,
  ComponentType,
  GeneratedComponent,
  GeneratedComponentItem,
  GeneratedScreen,
} from "@/lib/ai/schemas";

import type { ResolvedTokens } from "@/lib/design/tokens";

type RenderProps = {
  component: GeneratedComponent;
  tokens: ResolvedTokens;
  screenState?: ComponentStateName;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

type GenericRecord = Record<string, unknown>;

/* -------------------------------------------------------------------------- */
/* SAFE VALUE HELPERS                                                         */
/* -------------------------------------------------------------------------- */

function stringValue(
  value: unknown,
  fallback = "",
): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return fallback;
}

function booleanValue(
  value: unknown,
  fallback = false,
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function numberValue(
  value: unknown,
  fallback = 0,
): number {
  return typeof value === "number"
    ? value
    : fallback;
}

function recordValue(
  value: unknown,
): GenericRecord {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as GenericRecord;
  }

  return {};
}

/* -------------------------------------------------------------------------- */
/* COLOR HELPERS                                                              */
/* -------------------------------------------------------------------------- */

function hexToRgb(
  color: string,
): [number, number, number] | null {
  const value = color.trim();

  if (!value.startsWith("#")) {
    return null;
  }

  const hex = value.slice(1);

  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ];
  }

  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  return null;
}

function isLightColor(
  color: string,
): boolean {
  const rgb = hexToRgb(color);

  if (!rgb) {
    return true;
  }

  const [r, g, b] = rgb.map(
    (value) => value / 255,
  );

  const luminance =
    0.2126 * r +
    0.7152 * g +
    0.0722 * b;

  return luminance > 0.62;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT TYPE INFERENCE                                                   */
/* -------------------------------------------------------------------------- */

function inferComponentType(
  component: GeneratedComponent,
): ComponentType {
  if (component.type !== "custom") {
    return component.type;
  }

  const text = [
    component.name,
    component.id,
    stringValue(component.props.title),
    stringValue(component.props.label),
  ]
    .join(" ")
    .toLowerCase();

  if (
    text.includes("header") ||
    text.includes("top bar") ||
    text.includes("app bar")
  ) {
    return "header";
  }

  if (
    text.includes("list") ||
    text.includes("feed") ||
    text.includes("tasks") ||
    text.includes("assignments") ||
    text.includes("projects") ||
    text.includes("deadlines") ||
    text.includes("todo") ||
    text.includes("items") ||
    text.includes("transaction") ||
    text.includes("activity") ||
    text.includes("history")
  ) {
    return "list";
  }

  if (
    text.includes("balance") ||
    text.includes("account card") ||
    text.includes("summary card") ||
    text.includes("stat card")
  ) {
    return "card";
  }

  if (
    text.includes("button") ||
    text.includes("action")
  ) {
    return "button";
  }

  if (
    text.includes("navigation") ||
    text.includes("nav bar") ||
    text.includes("bottom nav") ||
    text.includes("tab bar")
  ) {
    return "navigation";
  }

  if (
    text.includes("tabs") ||
    text.includes("categories")
  ) {
    return "tabs";
  }

  if (text.includes("search")) {
    return "search";
  }

  if (
    text.includes("avatar") ||
    text.includes("profile image")
  ) {
    return "avatar";
  }

  if (
    text.includes("divider") ||
    text.includes("separator")
  ) {
    return "divider";
  }

  if (text.includes("progress")) {
    return "progress";
  }

  if (
    text.includes("alert") ||
    text.includes("warning") ||
    text.includes("notice")
  ) {
    return "alert";
  }

  if (text.includes("banner")) {
    return "banner";
  }

  if (
    text.includes("input") ||
    text.includes("field")
  ) {
    return "input";
  }

  if (
    text.includes("chart") ||
    text.includes("graph") ||
    text.includes("analytics") ||
    text.includes("metric")
  ) {
    return "chart";
  }

  if (
    text.includes("grid") ||
    text.includes("catalog") ||
    text.includes("products") ||
    text.includes("gallery")
  ) {
    return "grid";
  }

  if (
    text.includes("form") ||
    text.includes("survey") ||
    text.includes("checkout form")
  ) {
    return "form";
  }

  if (
    text.includes("dialog") ||
    text.includes("modal") ||
    text.includes("sheet") ||
    text.includes("popup")
  ) {
    return "dialog";
  }

  if (
    text.includes("image") ||
    text.includes("photo") ||
    text.includes("media")
  ) {
    return "image";
  }

  if (
    text.includes("text") ||
    text.includes("caption")
  ) {
    return "text";
  }

  return "container";
}

/* -------------------------------------------------------------------------- */
/* ITEM HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function itemRecord(
  value: unknown,
): GenericRecord {
  return recordValue(value);
}

function itemTitle(
  value: unknown,
  fallback = "Item",
): string {
  const item = itemRecord(value);

  return (
    stringValue(item.title) ||
    stringValue(item.name) ||
    stringValue(item.label) ||
    fallback
  );
}

function itemSubtitle(
  value: unknown,
): string {
  const item = itemRecord(value);

  return (
    stringValue(item.subtitle) ||
    stringValue(item.description) ||
    stringValue(item.meta)
  );
}

function itemAmount(
  value: unknown,
): string {
  const item = itemRecord(value);

  return (
    stringValue(item.amount) ||
    stringValue(item.price) ||
    stringValue(item.value)
  );
}

/* -------------------------------------------------------------------------- */
/* SELECTION WRAPPER                                                          */
/* -------------------------------------------------------------------------- */

function wrap(
  id: string,
  selectedId: string | null | undefined,
  onSelect: ((id: string) => void) | undefined,
  children: ReactNode,
) {
  const selected = selectedId === id;

  return (
    <div
      data-layer-id={id}
      className={
        selected
          ? "rounded-[18px] ring-2 ring-violet-400/70 ring-offset-2"
          : ""
      }
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(id);
      }}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TRANSACTION SECTION                                                        */
/* -------------------------------------------------------------------------- */

function ListSection({
  component,
  items,
  textColor,
  mutedColor,
  surfaceColor,
  primaryColor,
  accentColor,
  borderColor,
  selectedId,
  onSelect,
}: {
  component: GeneratedComponent;
  items: unknown[];
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const title = stringValue(
    component.props.title,
    stringValue(component.name, "Items"),
  );

  return wrap(
    component.id,
    selectedId,
    onSelect,
    <section className="px-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2
            className="text-[16px] font-bold"
            style={{
              color: textColor,
            }}
          >
            {title}
          </h2>

          {component.props.subtitle && (
            <p
              className="mt-1 text-[10px]"
              style={{
                color: mutedColor,
              }}
            >
              {stringValue(
                component.props.subtitle,
              )}
            </p>
          )}
        </div>

        {component.props.actionText && (
          <span
            className="text-[10px] font-semibold"
            style={{
              color: primaryColor,
            }}
          >
            {stringValue(
              component.props.actionText,
            )}
          </span>
        )}
      </div>

      <div
        className="overflow-hidden rounded-[20px] border"
        style={{
          borderColor,
        }}
      >
        {items.length > 0 ? (
          items.map((item, index) => (
            <ListItemRow
              key={`${itemTitle(item)}-${index}`}
              item={item}
              textColor={textColor}
              mutedColor={mutedColor}
              surfaceColor={surfaceColor}
              primaryColor={primaryColor}
              accentColor={accentColor}
              borderColor={borderColor}
              isLast={index === items.length - 1}
            />
          ))
        ) : (
          <div
            className="p-6 text-center"
            style={{
              backgroundColor: surfaceColor,
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{
                color: textColor,
              }}
            >
              {stringValue(component.props.emptyText, "No items available")}
            </p>
            <p
              className="mt-1 text-[10px]"
              style={{
                color: mutedColor,
              }}
            >
              Items will appear here.
            </p>
          </div>
        )}
      </div>
    </section>,
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN NODE RENDERER                                                         */
/* -------------------------------------------------------------------------- */

function RenderNode({
  component,
  tokens,
  screenState,
  selectedId,
  onSelect,
}: RenderProps) {
  const props = component.props || {};

  const type = inferComponentType(component);

  const state =
    component.activeState ||
    screenState ||
    "default";

  const {
    colors,
    spacing,
  } = tokens;

  const backgroundColor =
    colors.background || "#F8FAFC";

  const screenIsLight =
    isLightColor(backgroundColor);

  const textColor =
    screenIsLight
      ? "#0F172A"
      : "#F8FAFC";

  const mutedColor =
    screenIsLight
      ? "#64748B"
      : "#CBD5E1";

  const surfaceColor =
    colors.surface ||
    (screenIsLight
      ? "#FFFFFF"
      : "#172033");

  const surfaceTextColor =
    isLightColor(surfaceColor)
      ? "#0F172A"
      : "#F8FAFC";

  const primaryColor =
    colors.primary || "#6C5CE7";

  const accentColor =
    colors.accent || primaryColor;

  const borderColor =
    screenIsLight
      ? "#E2E8F0"
      : "#334155";

  const children =
    component.children?.map((child) => (
      <RenderNode
        key={child.id}
        component={child}
        tokens={tokens}
        screenState={screenState}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    ));

  /* ------------------------------------------------------------------------ */
  /* STATES                                                                   */
  /* ------------------------------------------------------------------------ */

  if (state === "loading") {
    return wrap(
      component.id,
      selectedId,
      onSelect,
      <div
        className="mx-5 rounded-[20px] p-4"
        style={{
          backgroundColor: surfaceColor,
          border: `1px solid ${borderColor}`,
        }}
      >
        <div
          className="h-4 w-2/3 animate-pulse rounded-lg"
          style={{
            backgroundColor: `${mutedColor}20`,
          }}
        />

        <div
          className="mt-3 h-3 w-1/2 animate-pulse rounded-lg"
          style={{
            backgroundColor: `${mutedColor}15`,
          }}
        />
      </div>,
    );
  }

  if (state === "empty") {
    return wrap(
      component.id,
      selectedId,
      onSelect,
      <div
        className="mx-5 rounded-[20px] border border-dashed p-6 text-center"
        style={{
          borderColor: `${mutedColor}40`,
          backgroundColor: surfaceColor,
        }}
      >
        <p
          className="text-sm font-medium"
          style={{
            color: surfaceTextColor,
          }}
        >
          {stringValue(
            props.emptyText,
            stringValue(
              props.title,
              "Nothing here yet",
            ),
          )}
        </p>
      </div>,
    );
  }

  if (state === "error") {
    return wrap(
      component.id,
      selectedId,
      onSelect,
      <div
        className="mx-5 rounded-[20px] border p-4"
        style={{
          borderColor: "#EF444455",
          backgroundColor: "#FEF2F2",
        }}
      >
        <p
          className="text-sm font-medium"
          style={{
            color: "#B91C1C",
          }}
        >
          {stringValue(
            props.errorText,
            stringValue(
              props.title,
              "Something went wrong",
            ),
          )}
        </p>
      </div>,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* COMPONENTS                                                               */
  /* ------------------------------------------------------------------------ */

  switch (type) {
    case "container":
    case "stack": {
      const isRow = props.direction === "row";
      const gapVal = stringValue(props.gap) || spacing.md;
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div
          className={`flex ${isRow ? "flex-row items-center flex-wrap" : "flex-col"} px-5`}
          style={{
            gap: gapVal,
          }}
        >
          {children && children.length > 0 ? (
            children
          ) : props.title || props.subtitle ? (
            <div
              className="w-full rounded-2xl border p-4"
              style={{
                backgroundColor: surfaceColor,
                borderColor,
              }}
            >
              {props.title && (
                <p className="text-[13px] font-semibold" style={{ color: surfaceTextColor }}>
                  {stringValue(props.title)}
                </p>
              )}
              {props.subtitle && (
                <p className="mt-1 text-[11px]" style={{ color: mutedColor }}>
                  {stringValue(props.subtitle)}
                </p>
              )}
            </div>
          ) : null}
        </div>,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* HEADER                                                                  */
    /* ---------------------------------------------------------------------- */

    case "header":
    case "heading":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <header
          className="px-5 pb-1 pt-5"
          style={{
            backgroundColor,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {props.badge && (
                <div
                  className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{
                    color: accentColor,
                  }}
                >
                  {stringValue(props.badge)}
                </div>
              )}

              <h1
                className="truncate"
                style={{
                  color: textColor,
                  fontSize: "24px",
                  lineHeight: 1.15,
                  fontWeight: 750,
                  letterSpacing: "-0.025em",
                }}
              >
                {stringValue(
                  props.title,
                  component.name,
                )}
              </h1>

              {props.subtitle && (
                <p
                  className="mt-1.5"
                  style={{
                    color: mutedColor,
                    fontSize: "12px",
                    lineHeight: 1.4,
                  }}
                >
                  {stringValue(
                    props.subtitle,
                  )}
                </p>
              )}
            </div>

            {booleanValue(
              props.showLogo,
              true,
            ) && (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor:
                      `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  {stringValue(
                    props.title,
                    "N",
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
          </div>
        </header>,
      );

    /* ---------------------------------------------------------------------- */
    /* CARDS                                                                   */
    /* ---------------------------------------------------------------------- */

    case "card":
    case "hero":
    case "banner": {
      const semanticText = [
        component.name,
        stringValue(props.title),
        stringValue(props.subtitle),
      ]
        .join(" ")
        .toLowerCase();

      const cardItems =
        Array.isArray(props.items)
          ? props.items
          : [];

      const isListCard =
        type === "card" &&
        (
          semanticText.includes("list") ||
          semanticText.includes("items") ||
          semanticText.includes("tasks") ||
          semanticText.includes("assignments") ||
          semanticText.includes("deadlines") ||
          semanticText.includes("transaction") ||
          semanticText.includes("activity") ||
          semanticText.includes("history")
        );

      if (
        isListCard ||
        (
          cardItems.length > 0 &&
          (semanticText.includes("recent") || semanticText.includes("today") || semanticText.includes("upcoming"))
        )
      ) {
        return (
          <ListSection
            component={component}
            items={cardItems}
            textColor={textColor}
            mutedColor={mutedColor}
            surfaceColor={surfaceColor}
            primaryColor={primaryColor}
            accentColor={accentColor}
            borderColor={borderColor}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        );
      }

      const isBalanceCard =
        semanticText.includes("balance") ||
        semanticText.includes("account summary") ||
        semanticText.includes("available balance") ||
        semanticText.includes("net worth");

      const amount =
        stringValue(props.amount) ||
        stringValue(props.value);

      const currency =
        stringValue(props.currency);

      const change =
        stringValue(props.change);

      const changeLabel =
        stringValue(props.changeLabel);

      if (
        isBalanceCard ||
        type === "hero"
      ) {
        return wrap(
          component.id,
          selectedId,
          onSelect,
          <section
            className="mx-5 overflow-hidden"
            style={{
              borderRadius: "22px",
              background:
                `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              color: "#FFFFFF",
              boxShadow:
                "0 12px 30px rgba(37, 99, 235, 0.18)",
            }}
          >
            <div className="p-5">
              {props.badge && (
                <p
                  className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    color:
                      "rgba(255,255,255,0.75)",
                  }}
                >
                  {stringValue(props.badge)}
                </p>
              )}

              <p
                className="text-[12px]"
                style={{
                  color:
                    "rgba(255,255,255,0.75)",
                }}
              >
                {stringValue(
                  props.title,
                  "Total Balance",
                )}
              </p>

              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className="tracking-tight"
                  style={{
                    fontSize: "30px",
                    lineHeight: 1.1,
                    fontWeight: 750,
                  }}
                >
                  {amount || "$12,840.00"}
                </span>

                {currency && (
                  <span
                    className="text-[10px]"
                    style={{
                      color:
                        "rgba(255,255,255,0.7)",
                    }}
                  >
                    {currency}
                  </span>
                )}
              </div>

              {change && (
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-1 text-[10px] font-semibold"
                    style={{
                      backgroundColor:
                        "rgba(255,255,255,0.16)",
                    }}
                  >
                    {change}
                  </span>

                  {changeLabel && (
                    <span
                      className="text-[10px]"
                      style={{
                        color:
                          "rgba(255,255,255,0.75)",
                      }}
                    >
                      {changeLabel}
                    </span>
                  )}
                </div>
              )}

              {props.subtitle && (
                <p
                  className="mt-3 text-[11px]"
                  style={{
                    color:
                      "rgba(255,255,255,0.72)",
                  }}
                >
                  {stringValue(
                    props.subtitle,
                  )}
                </p>
              )}
            </div>
          </section>,
        );
      }

      return wrap(
        component.id,
        selectedId,
        onSelect,
        <section
          className="mx-5 rounded-[20px] border p-4"
          style={{
            backgroundColor: surfaceColor,
            borderColor,
          }}
        >
          {props.badge && (
            <span
              className="mb-2 inline-flex rounded-full px-2 py-1 text-[9px] font-semibold"
              style={{
                backgroundColor:
                  `${accentColor}15`,
                color: accentColor,
              }}
            >
              {stringValue(props.badge)}
            </span>
          )}

          <h2
            className="text-[15px] font-bold"
            style={{
              color: surfaceTextColor,
            }}
          >
            {stringValue(
              props.title,
              component.name,
            )}
          </h2>

          {props.subtitle && (
            <p
              className="mt-1.5 text-[11px] leading-5"
              style={{
                color: mutedColor,
              }}
            >
              {stringValue(props.subtitle)}
            </p>
          )}
        </section>,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* BUTTON                                                                  */
    /* ---------------------------------------------------------------------- */

    case "button":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div className="mx-5">
          <button
            type="button"
            disabled={state === "disabled"}
            className="w-full rounded-2xl py-3.5 text-[13px] font-semibold transition-transform active:scale-[0.98]"
            style={{
              backgroundColor:
                state === "disabled"
                  ? "#CBD5E1"
                  : primaryColor,
              color: "#FFFFFF",
              boxShadow:
                state === "disabled"
                  ? "none"
                  : `0 8px 18px ${primaryColor}30`,
            }}
          >
            {stringValue(
              props.actionText,
              stringValue(
                props.label,
                stringValue(
                  props.title,
                  component.name ||
                  "Continue",
                ),
              ),
            )}
          </button>
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* LIST                                                                     */
    /* ---------------------------------------------------------------------- */

    case "list":
    case "feed": {
      const items =
        Array.isArray(props.items)
          ? props.items
          : [];

      return (
        <ListSection
          component={component}
          items={items}
          textColor={textColor}
          mutedColor={mutedColor}
          surfaceColor={surfaceColor}
          primaryColor={primaryColor}
          accentColor={accentColor}
          borderColor={borderColor}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      );
    }

    /* ---------------------------------------------------------------------- */
    /* GRID                                                                     */
    /* ---------------------------------------------------------------------- */

    case "grid": {
      const items =
        Array.isArray(props.items)
          ? props.items
          : [];
      const colCount = Math.max(
        1,
        numberValue(
          props.columns,
          2,
        ),
      );
      const gapVal = stringValue(props.gap) || spacing.sm;

      return wrap(
        component.id,
        selectedId,
        onSelect,
        <section className="px-5">
          {props.title && (
            <h2
              className="mb-3 text-[15px] font-bold"
              style={{
                color: textColor,
              }}
            >
              {stringValue(props.title)}
            </h2>
          )}

          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
              gap: gapVal,
            }}
          >
            {children && children.length > 0 ? (
              children
            ) : items.length > 0 ? (
              items.map((item, index) => (
                <ActionTile
                  key={`${itemTitle(item)}-${index}`}
                  item={item}
                  primaryColor={primaryColor}
                  textColor={textColor}
                  mutedColor={mutedColor}
                  surfaceColor={surfaceColor}
                  borderColor={borderColor}
                />
              ))
            ) : (
              <div
                className="col-span-full rounded-2xl border border-dashed p-4 text-center text-xs"
                style={{ borderColor, color: mutedColor }}
              >
                Grid container
              </div>
            )}
          </div>
        </section>,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* TEXT                                                                     */
    /* ---------------------------------------------------------------------- */

    case "text":
    case "link":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <p
          className="px-5"
          style={{
            color:
              type === "link"
                ? primaryColor
                : mutedColor,
            fontSize:
              type === "link"
                ? "12px"
                : "11px",
            fontWeight:
              type === "link"
                ? 600
                : 400,
            lineHeight: 1.5,
          }}
        >
          {stringValue(
            props.title,
            stringValue(
              props.label,
              stringValue(
                props.subtitle,
                component.name,
              ),
            ),
          )}
        </p>,
      );

    /* ---------------------------------------------------------------------- */
    /* SEARCH / INPUT                                                          */
    /* ---------------------------------------------------------------------- */

    case "search":
    case "input":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div className="px-5">
          {props.label && (
            <label
              className="mb-1.5 block text-[11px] font-semibold"
              style={{ color: textColor }}
            >
              {stringValue(props.label)}
            </label>
          )}
          <div
            className="flex items-center rounded-2xl border px-4 py-3"
            style={{
              backgroundColor: surfaceColor,
              borderColor,
            }}
          >
            {type === "search" && (
              <span
                className="mr-2 text-base"
                style={{
                  color: mutedColor,
                }}
              >
                ⌕
              </span>
            )}

            <span
              className="text-[12px]"
              style={{
                color: props.value ? textColor : mutedColor,
              }}
            >
              {stringValue(
                props.value,
                stringValue(
                  props.placeholder,
                  type === "search" ? "Search…" : "Enter value…",
                ),
              )}
            </span>
          </div>
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* FORM                                                                   */
    /* ---------------------------------------------------------------------- */

    case "form":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <form
          className="mx-5 flex flex-col gap-3 rounded-[24px] border p-4"
          style={{
            backgroundColor: surfaceColor,
            borderColor,
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          {props.title && (
            <h3 className="text-[14px] font-bold" style={{ color: surfaceTextColor }}>
              {stringValue(props.title)}
            </h3>
          )}
          {children && children.length > 0 ? (
            children
          ) : (
            <div className="flex flex-col gap-2.5">
              <div
                className="rounded-xl border px-3 py-2 text-[11px]"
                style={{ backgroundColor, borderColor, color: mutedColor }}
              >
                {stringValue(props.placeholder, "Input field")}
              </div>
              <button
                type="button"
                className="w-full rounded-xl py-2 text-[12px] font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {stringValue(props.actionText, "Submit")}
              </button>
            </div>
          )}
        </form>,
      );

    /* ---------------------------------------------------------------------- */
    /* DIALOG                                                                 */
    /* ---------------------------------------------------------------------- */

    case "dialog":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div className="mx-5 rounded-[24px] border p-4 shadow-xl" style={{ backgroundColor: surfaceColor, borderColor }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor }}>
            <h3 className="text-[13px] font-bold" style={{ color: surfaceTextColor }}>
              {stringValue(props.title, "Dialog")}
            </h3>
            <span className="text-[10px] text-white/40">✕</span>
          </div>
          <div className="mt-3">
            {children && children.length > 0 ? (
              children
            ) : (
              <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>
                {stringValue(props.subtitle, stringValue(props.description, "Dialog content and details."))}
              </p>
            )}
          </div>
          {props.actionText && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="rounded-xl px-4 py-1.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {stringValue(props.actionText)}
              </button>
            </div>
          )}
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* SELECT / SWITCH / CHECKBOX / RADIO                                     */
    /* ---------------------------------------------------------------------- */

    case "select":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div className="px-5">
          {props.label && (
            <label className="mb-1 block text-[11px] font-medium" style={{ color: textColor }}>
              {stringValue(props.label)}
            </label>
          )}
          <div
            className="flex items-center justify-between rounded-2xl border px-4 py-3 text-[12px]"
            style={{ backgroundColor: surfaceColor, borderColor, color: textColor }}
          >
            <span>{stringValue(props.value, stringValue(props.placeholder, "Select an option…"))}</span>
            <span className="text-[10px] text-white/50">▼</span>
          </div>
        </div>,
      );

    case "switch":
    case "checkbox":
    case "radio":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div className="mx-5 flex items-center justify-between rounded-xl border p-3" style={{ backgroundColor: surfaceColor, borderColor }}>
          <span className="text-[12px] font-medium" style={{ color: surfaceTextColor }}>
            {stringValue(props.label, stringValue(props.title, component.name))}
          </span>
          <div
            className={`h-5 w-9 rounded-full p-0.5 transition-colors ${booleanValue(props.checked, true) ? "bg-violet-600" : "bg-white/20"}`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition-transform ${booleanValue(props.checked, true) ? "translate-x-4" : "translate-x-0"}`}
            />
          </div>
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* TABS                                                                     */
    /* ---------------------------------------------------------------------- */

    case "tabs":
    case "categories":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div className="flex gap-2 overflow-x-auto px-5">
          {(
            Array.isArray(props.tabs)
              ? props.tabs
              : Array.isArray(props.categories)
                ? props.categories
                : [
                  "Overview",
                  "Activity",
                  "Insights",
                ]
          )
            .slice(0, 5)
            .map((tab, index) => (
              <span
                key={`${stringValue(tab)}-${index}`}
                className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold"
                style={{
                  backgroundColor:
                    index === 0
                      ? primaryColor
                      : surfaceColor,
                  color:
                    index === 0
                      ? "#FFFFFF"
                      : surfaceTextColor,
                  border:
                    index === 0
                      ? "none"
                      : `1px solid ${borderColor}`,
                }}
              >
                {stringValue(tab)}
              </span>
            ))}
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* NAVIGATION                                                              */
    /* ---------------------------------------------------------------------- */

    case "navigation":
    case "tabbar":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <nav
          className="mx-5 flex items-center justify-around rounded-[20px] border px-3 py-3"
          style={{
            backgroundColor: surfaceColor,
            borderColor,
          }}
        >
          {(
            Array.isArray(props.tabs)
              ? props.tabs
              : [
                "Home",
                "Activity",
                "Insights",
                "Profile",
              ]
          )
            .slice(0, 5)
            .map((tab, index) => (
              <span
                key={`${stringValue(tab)}-${index}`}
                className="text-center text-[10px] font-semibold"
                style={{
                  color:
                    index === 0
                      ? primaryColor
                      : mutedColor,
                }}
              >
                {stringValue(tab)}
              </span>
            ))}
        </nav>,
      );

    /* ---------------------------------------------------------------------- */
    /* BADGE                                                                    */
    /* ---------------------------------------------------------------------- */

    case "badge":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            backgroundColor:
              `${accentColor}18`,
            color: accentColor,
          }}
        >
          {stringValue(
            props.badge,
            stringValue(
              props.label,
              component.name,
            ),
          )}
        </span>,
      );

    /* ---------------------------------------------------------------------- */
    /* ALERT                                                                    */
    /* ---------------------------------------------------------------------- */

    case "alert":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div
          className="mx-5 rounded-2xl border p-3"
          style={{
            backgroundColor: "#EFF6FF",
            borderColor: "#BFDBFE",
          }}
        >
          <p
            className="text-[12px] font-semibold"
            style={{
              color: "#1E40AF",
            }}
          >
            {stringValue(
              props.title,
              stringValue(
                props.message,
                "Notice",
              ),
            )}
          </p>
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* PROGRESS                                                                 */
    /* ---------------------------------------------------------------------- */

    case "progress":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div className="px-5">
          {props.title && (
            <div className="mb-2 flex justify-between">
              <span
                className="text-[11px] font-semibold"
                style={{
                  color: textColor,
                }}
              >
                {stringValue(props.title)}
              </span>

              <span
                className="text-[10px]"
                style={{
                  color: mutedColor,
                }}
              >
                {numberValue(
                  props.progress,
                  60,
                )}
                %
              </span>
            </div>
          )}

          <div
            className="h-2 overflow-hidden rounded-full"
            style={{
              backgroundColor:
                `${mutedColor}20`,
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    numberValue(
                      props.progress,
                      60,
                    ),
                  ),
                )}%`,
                backgroundColor: primaryColor,
              }}
            />
          </div>
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* DIVIDER                                                                  */
    /* ---------------------------------------------------------------------- */

    case "divider":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div
          className="mx-5 h-px"
          style={{
            backgroundColor: borderColor,
          }}
        />,
      );

    /* ---------------------------------------------------------------------- */
    /* AVATAR                                                                   */
    /* ---------------------------------------------------------------------- */

    case "avatar":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div
          className="mx-5 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
          style={{
            backgroundColor:
              `${primaryColor}15`,
            color: primaryColor,
          }}
        >
          {stringValue(
            props.title,
            "N",
          )
            .charAt(0)
            .toUpperCase()}
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* IMAGE & MEDIA                                                          */
    /* ---------------------------------------------------------------------- */

    case "image":
    case "media":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div className="px-5">
          <div
            className="relative flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}25)`,
              borderColor,
              color: textColor,
            }}
          >
            {props.title && (
              <span className="text-[12px] font-semibold text-white/90">
                {stringValue(props.title)}
              </span>
            )}
            <span className="mt-1 text-[10px] text-white/60">
              {stringValue(props.imageHint, stringValue(props.subtitle, "Media Preview"))}
            </span>
            {props.badge && (
              <span
                className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                style={{ backgroundColor: `${primaryColor}40`, color: "#fff" }}
              >
                {stringValue(props.badge)}
              </span>
            )}
          </div>
        </div>,
      );

    /* ---------------------------------------------------------------------- */
    /* CHART                                                                  */
    /* ---------------------------------------------------------------------- */

    case "chart":
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <section
          className="mx-5 rounded-[22px] border p-4"
          style={{ backgroundColor: surfaceColor, borderColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-bold" style={{ color: surfaceTextColor }}>
                {stringValue(props.title, "Analytics")}
              </h3>
              {props.subtitle && (
                <p className="text-[10px]" style={{ color: mutedColor }}>
                  {stringValue(props.subtitle)}
                </p>
              )}
            </div>
            {props.badge && (
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                {stringValue(props.badge)}
              </span>
            )}
          </div>

          {/* Stylized sparkline / bar visualization */}
          <div className="mt-4 flex h-20 items-end justify-between gap-1.5 px-1">
            {[35, 55, 40, 75, 60, 90, 80].map((val, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${val}%`,
                    backgroundColor: i === 5 ? primaryColor : `${primaryColor}35`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px]" style={{ color: mutedColor }}>
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
        </section>,
      );

    /* ---------------------------------------------------------------------- */
    /* CUSTOM / UNKNOWN                                                        */
    /* ---------------------------------------------------------------------- */

    default: {
      /*
       * If a custom component contains real children,
       * render those children.
       */
      if (component.children?.length) {
        return wrap(
          component.id,
          selectedId,
          onSelect,
          <div className="flex flex-col gap-4">
            {children}
          </div>,
        );
      }

      /*
       * Look for meaningful content.
       */
      const fallbackTitle =
        stringValue(props.title) ||
        stringValue(props.label) ||
        stringValue(props.subtitle) ||
        stringValue(props.description);

      /*
       * Empty custom component:
       * render nothing.
       */
      if (!fallbackTitle) {
        return null;
      }

      /*
       * Custom component with actual content.
       */
      return wrap(
        component.id,
        selectedId,
        onSelect,
        <div
          className="mx-5 rounded-2xl border p-4"
          style={{
            backgroundColor: surfaceColor,
            borderColor,
          }}
        >
          <p
            className="text-[12px] font-semibold"
            style={{
              color: surfaceTextColor,
            }}
          >
            {fallbackTitle}
          </p>
        </div>,
      );
    }
  }
}

function ListItemRow({
  item,
  textColor,
  mutedColor,
  surfaceColor,
  primaryColor,
  accentColor,
  borderColor,
  isLast,
}: {
  item:
  | GeneratedComponentItem
  | unknown;
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  isLast: boolean;
}) {
  const rec = itemRecord(item);
  const title = itemTitle(item, "Item");
  const subtitle = itemSubtitle(item);
  const amount = itemAmount(item);
  const tag = stringValue(rec.tag) || stringValue(rec.status) || stringValue(rec.badge);
  const meta = stringValue(rec.meta);

  const amountLooksPositive = amount.startsWith("+");
  const amountLooksNegative = amount.startsWith("-");

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
      style={{
        backgroundColor: surfaceColor,
        borderBottom: isLast
          ? "none"
          : `1px solid ${borderColor}`,
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold"
        style={{
          backgroundColor: `${primaryColor}15`,
          color: primaryColor,
        }}
      >
        {title.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className="truncate text-[12px] font-semibold"
            style={{
              color: textColor,
            }}
          >
            {title}
          </p>

          {tag && (
            <span
              className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor,
              }}
            >
              {tag}
            </span>
          )}
        </div>

        {subtitle && (
          <p
            className="mt-0.5 truncate text-[10px]"
            style={{
              color: mutedColor,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {amount ? (
        <span
          className="shrink-0 text-[11px] font-semibold"
          style={{
            color: amountLooksPositive
              ? "#15803D"
              : amountLooksNegative
              ? "#DC2626"
              : textColor,
          }}
        >
          {amount}
        </span>
      ) : meta ? (
        <span
          className="shrink-0 text-[10px]"
          style={{
            color: mutedColor,
          }}
        >
          {meta}
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ACTION TILE                                                                */
/* -------------------------------------------------------------------------- */

function ActionTile({
  item,
  primaryColor,
  textColor,
  mutedColor,
  surfaceColor,
  borderColor,
}: {
  item:
  | GeneratedComponentItem
  | unknown;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  borderColor: string;
}) {
  const title =
    itemTitle(item, "Action");

  const subtitle =
    itemSubtitle(item);

  return (
    <div
      className="rounded-2xl border p-3"
      style={{
        backgroundColor: surfaceColor,
        borderColor,
      }}
    >
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
        style={{
          backgroundColor:
            `${primaryColor}15`,
          color: primaryColor,
        }}
      >
        {title.charAt(0).toUpperCase()}
      </div>

      <p
        className="text-[11px] font-semibold"
        style={{
          color: textColor,
        }}
      >
        {title}
      </p>

      {subtitle && (
        <p
          className="mt-1 text-[9px] leading-4"
          style={{
            color: mutedColor,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DESIGN RENDERER                                                            */
/* -------------------------------------------------------------------------- */

export function DesignRenderer({
  screen,
  tokens,
  selectedId,
  onSelect,
}: {
  screen: GeneratedScreen;
  tokens: ResolvedTokens;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  if (!screen.components.length) {
    return (
      <div
        className="flex h-full items-center justify-center p-8 text-center"
        style={{
          color: tokens.colors.muted,
        }}
      >
        Empty screen — add components via refinement.
      </div>
    );
  }

  const backgroundColor =
    tokens.colors.background ||
    "#F8FAFC";

  const screenIsLight =
    isLightColor(backgroundColor);

  const textColor =
    screenIsLight
      ? "#0F172A"
      : "#F8FAFC";

  // Check if screen has a single top-level container/grid/stack wrapping the view
  const hasSingleRootLayout =
    screen.components.length === 1 &&
    ["container", "stack", "grid"].includes(screen.components[0].type);

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      <div className="flex-1 overflow-y-auto pb-6">
        {hasSingleRootLayout ? (
          <RenderNode
            component={screen.components[0]}
            tokens={tokens}
            screenState={screen.previewState}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ) : (
          <div
            className="flex flex-col"
            style={{
              gap: tokens.spacing?.md || "16px",
            }}
          >
            {screen.components.map((component) => (
              <RenderNode
                key={component.id}
                component={component}
                tokens={tokens}
                screenState={screen.previewState}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
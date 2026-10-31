"use client";

import {
    Check,
    GripVertical,
    Move,
    Pencil,
    RotateCcw,
    Trash2,
    X,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useDesigner } from "./designer-context";

type EditorOverlayProps = {
    components: any[];
    artboardWidth: number;
    artboardHeight: number;
};

type Position = {
    x: number;
    y: number;
};

type Size = {
    width: number;
    height: number;
};

type PersistedEditorState = {
    positions: Record<string, Position>;
    sizes: Record<string, Size>;
    textOverrides: Record<string, string>;
    deletedIds: string[];
};

const STORAGE_PREFIX =
    "arquo-editor-state:";

function getStorageKey(
    screenId: string,
) {
    return `${STORAGE_PREFIX}${screenId}`;
}

function getInitialPosition(
    component: any,
    index: number,
    artboardWidth: number,
    artboardHeight: number,
): Position {
    const props = component?.props ?? {};
    const size = getInitialSize(component);

    // Toolbar-created elements open in the center of the artboard.
    const isNewEditorElement =
        typeof component?.id === "string" &&
        component.id.startsWith("editor-");

    const centeredX = Math.max(8, (artboardWidth - size.width) / 2);
    const centeredY = Math.max(8, (artboardHeight - size.height) / 2);

    return {
        x:
            typeof props.x === "number"
                ? props.x
                : typeof props.left === "number"
                    ? props.left
                    : isNewEditorElement
                        ? centeredX
                        : Math.max(24, centeredX),
        y:
            typeof props.y === "number"
                ? props.y
                : typeof props.top === "number"
                    ? props.top
                    : isNewEditorElement
                        ? centeredY
                        : 120 + index * 72,
    };
}

function getInitialSize(
    component: any,
): Size {
    const props = component?.props ?? {};
    const shapeType = props.shapeType;

    const shapeDefaults: Record<string, Size> = {
        rectangle: { width: 160, height: 100 },
        rounded: { width: 160, height: 100 },
        circle: { width: 120, height: 120 },
        pill: { width: 180, height: 56 },
        line: { width: 180, height: 4 },
    };

    const componentDefaults: Record<string, Size> = {
        text: { width: 220, height: 56 },
        button: { width: 220, height: 56 },
        card: { width: 220, height: 112 },
        input: { width: 220, height: 92 },
        badge: { width: 160, height: 48 },
        avatar: { width: 120, height: 96 },
        list: { width: 220, height: 190 },
    };

    const fallback =
        props.editorKind === "shape"
            ? shapeDefaults[shapeType] ?? shapeDefaults.rectangle
            : componentDefaults[component?.type] ?? { width: 220, height: 72 };

    const result = {
        width:
            typeof props.width === "number"
                ? props.width
                : fallback.width,
        height:
            typeof props.height === "number"
                ? props.height
                : fallback.height,
    };

    // Lists need enough room for a heading and at least three rows.
    if (component?.type === "list") {
        result.height = Math.max(result.height, 190);
        result.width = Math.max(result.width, 220);
    }

    return result;
}

function getComponentText(
    component: any,
) {
    const props = component?.props ?? {};

    return (
        props.text ??
        props.label ??
        props.content ??
        component?.name ??
        "New Text"
    );
}

function clamp(
    value: number,
    min: number,
    max: number,
) {
    return Math.min(
        Math.max(value, min),
        max,
    );
}

function loadEditorState(
    screenId: string,
): PersistedEditorState {
    const empty: PersistedEditorState = {
        positions: {},
        sizes: {},
        textOverrides: {},
        deletedIds: [],
    };

    if (
        typeof window === "undefined"
    ) {
        return empty;
    }

    try {
        const raw =
            window.localStorage.getItem(
                getStorageKey(screenId),
            );

        if (!raw) {
            return empty;
        }

        const parsed =
            JSON.parse(raw);

        return {
            positions:
                parsed?.positions ?? {},
            sizes: parsed?.sizes ?? {},
            textOverrides:
                parsed?.textOverrides ?? {},
            deletedIds:
                Array.isArray(
                    parsed?.deletedIds,
                )
                    ? parsed.deletedIds
                    : [],
        };
    } catch {
        return empty;
    }
}

function saveEditorState(
    screenId: string,
    state: PersistedEditorState,
) {
    if (
        typeof window === "undefined"
    ) {
        return;
    }

    try {
        window.localStorage.setItem(
            getStorageKey(screenId),
            JSON.stringify(state),
        );

        /*
         * Let LayersPanel know that the editor
         * state changed.
         */
        window.dispatchEvent(
            new CustomEvent(
                "arquo-editor-state-change",
                {
                    detail: {
                        screenId,
                    },
                },
            ),
        );
    } catch {
        // localStorage may be unavailable.
    }
}

export function EditorOverlay({
    components,
    artboardWidth,
    artboardHeight,
}: EditorOverlayProps) {
    const {
        activeScreenId,
        selectedLayerId,
        selectLayer,
        updateComponentProps,
    } = useDesigner();

    /*
     * ------------------------------------------------------------
     * SCREEN-SPECIFIC STATE
     * ------------------------------------------------------------
     */

    const [positions, setPositions] =
        useState<Record<string, Position>>(
            {},
        );

    const [sizes, setSizes] =
        useState<Record<string, Size>>({});

    const [textOverrides, setTextOverrides] =
        useState<Record<string, string>>(
            {},
        );

    const [deletedIds, setDeletedIds] =
        useState<Set<string>>(
            new Set(),
        );

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [editingField, setEditingField] =
        useState<string>("text");

    const [editingText, setEditingText] =
        useState("");

    const [draggingId, setDraggingId] =
        useState<string | null>(null);

    const [resizingId, setResizingId] =
        useState<string | null>(null);

    const [showToolbar, setShowToolbar] =
        useState<string | null>(null);

    const dragStart =
        useRef<{
            pointerX: number;
            pointerY: number;
            startX: number;
            startY: number;
        } | null>(null);

    const resizeStart =
        useRef<{
            pointerX: number;
            pointerY: number;
            width: number;
            height: number;
        } | null>(null);

    // Preserve the original content so Reset can restore it.
    const defaultPropsRef = useRef<Record<string, Record<string, any>>>({});

    useEffect(() => {
        components.forEach((component) => {
            if (!defaultPropsRef.current[component.id]) {
                defaultPropsRef.current[component.id] =
                    JSON.parse(JSON.stringify(component.props ?? {}));
            }
        });
    }, [components]);

    /*
     * ------------------------------------------------------------
     * LOAD STATE WHEN SCREEN CHANGES
     * ------------------------------------------------------------
     */

    useEffect(() => {
        if (!activeScreenId) {
            return;
        }

        const saved =
            loadEditorState(
                activeScreenId,
            );

        setPositions(
            saved.positions,
        );

        setSizes(saved.sizes);

        setTextOverrides(
            saved.textOverrides,
        );

        setDeletedIds(
            new Set(saved.deletedIds),
        );

        setEditingId(null);
        setEditingField("text");
        setEditingText("");
        setDraggingId(null);
        setResizingId(null);
        setShowToolbar(null);
    }, [activeScreenId]);

    /*
     * ------------------------------------------------------------
     * SAVE STATE
     * ------------------------------------------------------------
     */

    useEffect(() => {
        if (!activeScreenId) {
            return;
        }

        saveEditorState(
            activeScreenId,
            {
                positions,
                sizes,
                textOverrides,
                deletedIds:
                    Array.from(deletedIds),
            },
        );
    }, [
        activeScreenId,
        positions,
        sizes,
        textOverrides,
        deletedIds,
    ]);

    /*
     * ------------------------------------------------------------
     * INITIALIZE NEW COMPONENTS
     * ------------------------------------------------------------
     */

    useEffect(() => {
        setPositions((previous) => {
            const next = {
                ...previous,
            };

            components.forEach(
                (component, index) => {
                    if (!next[component.id]) {
                        next[component.id] =
                            getInitialPosition(
                                component,
                                index,
                                artboardWidth,
                                artboardHeight,
                            );
                    }
                },
            );

            return next;
        });

        setSizes((previous) => {
            const next = {
                ...previous,
            };

            components.forEach(
                (component) => {
                    const initialSize = getInitialSize(component);
                    if (!next[component.id]) {
                        next[component.id] = initialSize;
                    } else if (component.type === "list") {
                        next[component.id] = {
                            width: Math.max(next[component.id].width, initialSize.width),
                            height: Math.max(next[component.id].height, initialSize.height),
                        };
                    }
                },
            );

            return next;
        });
    }, [
        components,
        artboardWidth,
        artboardHeight,
    ]);

    /*
     * ------------------------------------------------------------
     * COMPONENT IDS
     * ------------------------------------------------------------
     */

    const componentIds = useMemo(
        () =>
            new Set(
                components.map(
                    (component) =>
                        component.id,
                ),
            ),
        [components],
    );

    /*
     * Remove stale state.
     */

    useEffect(() => {
        setPositions((previous) => {
            const next: Record<
                string,
                Position
            > = {};

            Object.entries(previous).forEach(
                ([id, value]) => {
                    if (componentIds.has(id)) {
                        next[id] = value;
                    }
                },
            );

            return next;
        });

        setSizes((previous) => {
            const next: Record<
                string,
                Size
            > = {};

            Object.entries(previous).forEach(
                ([id, value]) => {
                    if (componentIds.has(id)) {
                        next[id] = value;
                    }
                },
            );

            return next;
        });

        setTextOverrides((previous) => {
            const next: Record<
                string,
                string
            > = {};

            Object.entries(previous).forEach(
                ([id, value]) => {
                    if (componentIds.has(id)) {
                        next[id] = value;
                    }
                },
            );

            return next;
        });

        setDeletedIds((previous) => {
            const next = new Set<string>();

            previous.forEach((id) => {
                if (componentIds.has(id)) {
                    next.add(id);
                }
            });

            return next;
        });
    }, [componentIds]);

    /*
     * ------------------------------------------------------------
     * DELETE
     * ------------------------------------------------------------
     */

    const deleteComponent = (
        id: string,
    ) => {
        setDeletedIds((previous) => {
            const next = new Set(previous);
            next.add(id);
            return next;
        });

        setEditingId(null);
        setEditingText("");
        setShowToolbar(null);

        if (selectedLayerId === id) {
            selectLayer(null);
        }
    };

    /*
     * ------------------------------------------------------------
     * KEYBOARD DELETE
     * ------------------------------------------------------------
     */

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
            if (!selectedLayerId) {
                return;
            }

            if (editingId) {
                return;
            }

            const target =
                event.target as HTMLElement | null;

            if (
                target?.tagName ===
                "INPUT" ||
                target?.tagName ===
                "TEXTAREA" ||
                target?.isContentEditable
            ) {
                return;
            }

            if (
                event.key === "Delete" ||
                event.key === "Backspace"
            ) {
                const exists =
                    components.some(
                        (component) =>
                            component.id ===
                            selectedLayerId &&
                            !deletedIds.has(
                                component.id,
                            ),
                    );

                if (!exists) {
                    return;
                }

                event.preventDefault();

                deleteComponent(
                    selectedLayerId,
                );
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [
        selectedLayerId,
        editingId,
        components,
        deletedIds,
    ]);

    /*
     * ------------------------------------------------------------
     * DRAG
     * ------------------------------------------------------------
     */

    const beginDrag = (
        event: React.PointerEvent,
        component: any,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        const id = component.id;

        selectLayer(id);
        setShowToolbar(id);
        setDraggingId(id);

        const position =
            positions[id] ??
            getInitialPosition(
                component,
                0,
                artboardWidth,
                artboardHeight,
            );

        dragStart.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            startX: position.x,
            startY: position.y,
        };

        (
            event.currentTarget as HTMLElement
        ).setPointerCapture(
            event.pointerId,
        );
    };

    const updateDrag = (
        event: React.PointerEvent,
    ) => {
        if (
            !draggingId ||
            !dragStart.current
        ) {
            return;
        }

        const dx =
            event.clientX -
            dragStart.current.pointerX;

        const dy =
            event.clientY -
            dragStart.current.pointerY;

        const size =
            sizes[draggingId] ?? {
                width: 220,
                height: 48,
            };

        const x = clamp(
            dragStart.current.startX + dx,
            8,
            Math.max(
                8,
                artboardWidth -
                size.width -
                8,
            ),
        );

        const y = clamp(
            dragStart.current.startY + dy,
            8,
            Math.max(
                8,
                artboardHeight -
                size.height -
                8,
            ),
        );

        setPositions((previous) => ({
            ...previous,
            [draggingId]: {
                x,
                y,
            },
        }));
    };

    const endDrag = (
        event?: React.PointerEvent,
    ) => {
        if (
            event &&
            draggingId
        ) {
            try {
                (
                    event.currentTarget as HTMLElement
                ).releasePointerCapture(
                    event.pointerId,
                );
            } catch {
                // Already released.
            }
        }

        setDraggingId(null);
        dragStart.current = null;
    };

    /*
     * ------------------------------------------------------------
     * RESIZE
     * ------------------------------------------------------------
     */

    const beginResize = (
        event: React.PointerEvent,
        component: any,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        const id = component.id;

        selectLayer(id);
        setShowToolbar(id);
        setResizingId(id);

        const size =
            sizes[id] ??
            getInitialSize(component);

        resizeStart.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            width: size.width,
            height: size.height,
        };

        (
            event.currentTarget as HTMLElement
        ).setPointerCapture(
            event.pointerId,
        );
    };

    const updateResize = (
        event: React.PointerEvent,
    ) => {
        if (
            !resizingId ||
            !resizeStart.current
        ) {
            return;
        }

        const dx =
            event.clientX -
            resizeStart.current.pointerX;

        const dy =
            event.clientY -
            resizeStart.current.pointerY;

        const position =
            positions[resizingId] ?? {
                x: 0,
                y: 0,
            };

        const width = clamp(
            resizeStart.current.width + dx,
            80,
            Math.max(
                80,
                artboardWidth -
                position.x -
                8,
            ),
        );

        const resizingComponent = components.find(
            (component) => component.id === resizingId,
        );
        const resizingShape = resizingComponent?.props?.shapeType;
        const minHeight = resizingShape === "line" ? 3 : 32;
        let height = clamp(
            resizeStart.current.height + dy,
            minHeight,
            Math.max(
                minHeight,
                artboardHeight -
                position.y -
                8,
            ),
        );
        let finalWidth = width;

        if (resizingShape === "line") {
            height = 4;
        } else if (resizingShape === "circle") {
            const diameter = Math.min(width, height);
            finalWidth = diameter;
            height = diameter;
        }

        setSizes((previous) => ({
            ...previous,
            [resizingId]: {
                width: finalWidth,
                height,
            },
        }));
    };

    const endResize = (
        event?: React.PointerEvent,
    ) => {
        if (
            event &&
            resizingId
        ) {
            try {
                (
                    event.currentTarget as HTMLElement
                ).releasePointerCapture(
                    event.pointerId,
                );
            } catch {
                // Already released.
            }
        }

        setResizingId(null);
        resizeStart.current = null;
    };

    const addListItem = (component: any) => {
        const items = Array.isArray(component.props?.items)
            ? [...component.props.items]
            : [];
        items.push({
            title: `List Item ${items.length + 1}`,
            description: "Supporting information",
        });
        updateComponentProps(component.id, { items });
        setSizes((previous) => {
            const current = previous[component.id] ?? getInitialSize(component);
            return {
                ...previous,
                [component.id]: {
                    width: Math.max(current.width, 220),
                    height: Math.max(current.height, 190 + Math.max(0, items.length - 3) * 34),
                },
            };
        });
    };

    const removeListItem = (component: any, index: number) => {
        const items = Array.isArray(component.props?.items)
            ? [...component.props.items]
            : [];
        items.splice(index, 1);
        updateComponentProps(component.id, { items });
        setSizes((previous) => {
            const current = previous[component.id] ?? getInitialSize(component);
            return {
                ...previous,
                [component.id]: {
                    ...current,
                    height: Math.max(190, 122 + items.length * 34),
                },
            };
        });
    };

    /*
     * ------------------------------------------------------------
     * TEXT EDITING
     * ------------------------------------------------------------
     */

    const startEditing = (
        component: any,
        field = "text",
        fallbackValue?: string,
    ) => {
        const id = component.id;
        const overrideKey = `${id}::${field}`;
        const props = component.props ?? {};
        const legacyValue =
            field === "text"
                ? textOverrides[id]
                : undefined;

        const sourceValue =
            fallbackValue ??
            (field === "text"
                ? getComponentText(component)
                : props[field] ?? "");

        const currentText =
            textOverrides[overrideKey] ??
            legacyValue ??
            String(sourceValue);

        selectLayer(id);
        setEditingId(id);
        setEditingField(field);
        setEditingText(currentText);
        setShowToolbar(id);
    };

    const finishEditing = () => {
        if (!editingId) {
            return;
        }

        const finalText = editingText.trim();
        const overrideKey =
            editingField === "text"
                ? editingId
                : `${editingId}::${editingField}`;

        setTextOverrides((previous) => ({
            ...previous,
            [overrideKey]: finalText,
        }));

        const editedComponent = components.find(
            (component) => component.id === editingId,
        );

        if (editedComponent) {
            const fieldIndex = editingField.startsWith("item-")
                ? Number(editingField.slice(5))
                : -1;

            if (fieldIndex >= 0) {
                const items = Array.isArray(editedComponent.props?.items)
                    ? [...editedComponent.props.items]
                    : [];
                const currentItem = items[fieldIndex] ?? {};
                items[fieldIndex] = {
                    ...currentItem,
                    title: finalText,
                };
                updateComponentProps(editingId, { items });
            } else if (editingField === "text") {
                updateComponentProps(editingId, {
                    text: finalText,
                    label: finalText,
                    title: finalText,
                });
            } else if (
                editingField === "label" &&
                editedComponent.type === "button"
            ) {
                updateComponentProps(editingId, {
                    label: finalText,
                    actionText: finalText,
                });
            } else {
                updateComponentProps(editingId, {
                    [editingField]: finalText,
                });
            }
        }

        setEditingId(null);
        setEditingField("text");
        setEditingText("");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingField("text");
        setEditingText("");
    };

    const renderEditableField = (
        component: any,
        field: string,
        value: unknown,
        className: string,
    ) => {
        const id = component.id;
        const overrideKey = `${id}::${field}`;
        const displayValue = String(
            textOverrides[overrideKey] ??
            value ??
            "",
        );
        const isFieldEditing =
            editingId === id &&
            editingField === field;

        if (isFieldEditing) {
            return (
                <textarea
                    autoFocus
                    rows={1}
                    value={editingText}
                    onChange={(event) =>
                        setEditingText(event.target.value)
                    }
                    onPointerDown={(event) =>
                        event.stopPropagation()
                    }
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            cancelEditing();
                        }
                        if (
                            event.key === "Enter" &&
                            (event.metaKey || event.ctrlKey)
                        ) {
                            finishEditing();
                        }
                    }}
                    onBlur={finishEditing}
                    className={`${className} w-full resize-none rounded border border-violet-400 bg-[#171427] px-1 outline-none`}
                />
            );
        }

        return (
            <span
                className={`${className} cursor-text`}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    startEditing(
                        component,
                        field,
                        displayValue,
                    );
                }}
                title="Double-click to edit"
            >
                {displayValue}
            </span>
        );
    };

    /*
     * ------------------------------------------------------------
     * VISIBLE COMPONENTS
     * ------------------------------------------------------------
     */

    const visibleComponents =
        components.filter(
            (component) =>
                !deletedIds.has(
                    component.id,
                ),
        );

    if (
        visibleComponents.length === 0
    ) {
        return null;
    }

    return (
        <div
            className="pointer-events-none absolute inset-0 z-40"
            style={{
                width: artboardWidth,
                minHeight:
                    artboardHeight,
            }}
        >
            {visibleComponents.map(
                (component, index) => {
                    const id =
                        component.id;

                    const position =
                        positions[id] ??
                        getInitialPosition(
                            component,
                            index,
                            artboardWidth,
                            artboardHeight,
                        );

                    const size =
                        sizes[id] ??
                        getInitialSize(
                            component,
                        );

                    const selected =
                        selectedLayerId === id;

                    const editing =
                        editingId === id;

                    const dragging =
                        draggingId === id;

                    const resizing =
                        resizingId === id;

                    const type =
                        component.type;

                    const text =
                        textOverrides[id] ??
                        getComponentText(
                            component,
                        );

                    const isText =
                        type === "text" ||
                        component.name
                            ?.toLowerCase()
                            .includes("text");

                    const props = component.props ?? {};

                    const shapeType =
                        props.shapeType ??
                        (component.name?.toLowerCase().includes("circle")
                            ? "circle"
                            : component.name?.toLowerCase().includes("pill")
                                ? "pill"
                                : component.name?.toLowerCase().includes("rounded")
                                    ? "rounded"
                                    : component.name?.toLowerCase().includes("line")
                                        ? "line"
                                        : "rectangle");

                    const isShape =
                        props.editorKind === "shape" ||
                        type === "shape" ||
                        ["rectangle", "circle", "pill", "rounded rectangle", "line"].some(
                            (shape) => component.name?.toLowerCase().includes(shape),
                        );

                    return (
                        <div
                            key={id}
                            className="pointer-events-auto absolute"
                            style={{
                                left: position.x,
                                top: position.y,
                                width: size.width,
                                height: size.height,
                                minHeight: size.height,
                                zIndex:
                                    selected
                                        ? 50
                                        : 10,
                            }}
                            onPointerMove={(
                                event,
                            ) => {
                                if (dragging) {
                                    updateDrag(
                                        event,
                                    );
                                }

                                if (resizing) {
                                    updateResize(
                                        event,
                                    );
                                }
                            }}
                            onPointerUp={(
                                event,
                            ) => {
                                if (dragging) {
                                    endDrag(event);
                                }

                                if (resizing) {
                                    endResize(event);
                                }
                            }}
                            onPointerCancel={(
                                event,
                            ) => {
                                if (dragging) {
                                    endDrag(event);
                                }

                                if (resizing) {
                                    endResize(event);
                                }
                            }}
                        >
                            {selected && (
                                <div
                                    className="pointer-events-none absolute -inset-1 rounded-lg border border-violet-400/80"
                                    style={{
                                        boxShadow:
                                            "0 0 0 1px rgba(139,92,246,0.15)",
                                    }}
                                />
                            )}

                            {/* MOVE HANDLE */}

                            {selected && (
                                <button
                                    type="button"
                                    aria-label="Move element"
                                    title="Drag to move"
                                    className="absolute -left-7 top-1/2 z-50 flex h-6 w-6 -translate-y-1/2 cursor-move items-center justify-center rounded-md border border-violet-400/30 bg-[#171427] text-violet-300 shadow-lg"
                                    onPointerDown={(
                                        event,
                                    ) =>
                                        beginDrag(
                                            event,
                                            component,
                                        )
                                    }
                                >
                                    <Move size={12} />
                                </button>
                            )}

                            {/* EDIT TOOLBAR */}

                            {selected &&
                                showToolbar ===
                                id && (
                                    <div className="absolute -top-12 left-0 z-50 flex items-center gap-1 rounded-lg border border-white/10 bg-[#11121d]/95 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                                        {type === "list" && (
                                            <button
                                                type="button"
                                                onClick={() => addListItem(component)}
                                                className="flex h-7 items-center gap-1 rounded-md px-2 text-[10px] text-violet-200 hover:bg-violet-500/10"
                                            >
                                                + Add item
                                            </button>
                                        )}
                                        <button
                                                type="button"
                                                onClick={() =>
                                                    startEditing(
                                                        component,
                                                        "text",
                                                    )
                                                }
                                                className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] text-white/60 hover:bg-white/5 hover:text-white"
                                            >
                                                <Pencil
                                                    size={11}
                                                />
                                                Edit
                                        </button>

                                        <button
                                            type="button"
                                            title="Reset content to defaults"
                                            onClick={() => {
                                                const defaults =
                                                    defaultPropsRef.current[id] ?? {};
                                                updateComponentProps(id, defaults);

                                                setTextOverrides((previous) => {
                                                    const next = { ...previous };
                                                    Object.keys(next).forEach((key) => {
                                                        if (
                                                            key === id ||
                                                            key.startsWith(`${id}::`)
                                                        ) {
                                                            delete next[key];
                                                        }
                                                    });
                                                    return next;
                                                });

                                                setEditingId(null);
                                                setEditingField("text");
                                                setEditingText("");
                                            }}
                                            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] text-white/50 hover:bg-white/5 hover:text-white"
                                        >
                                            <RotateCcw size={11} />
                                            Reset
                                        </button>

                                        {/* DELETE */}

                                        <button
                                            type="button"
                                            title="Delete"
                                            aria-label="Delete element"
                                            onClick={() =>
                                                deleteComponent(
                                                    id,
                                                )
                                            }
                                            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] text-red-300 hover:bg-red-500/10 hover:text-red-200"
                                        >
                                            <Trash2
                                                size={11}
                                            />
                                            Delete
                                        </button>
                                    </div>
                                )}

                            {/* ELEMENT */}

                            <div
                                className={`relative h-full w-full ${selected
                                    ? "cursor-move"
                                    : "cursor-pointer"
                                    } ${dragging
                                        ? "opacity-80"
                                        : ""
                                    }`}
                                onPointerDown={(
                                    event,
                                ) => {
                                    if (
                                        editing ||
                                        resizing
                                    ) {
                                        return;
                                    }

                                    beginDrag(
                                        event,
                                        component,
                                    );
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    selectLayer(id);
                                    setShowToolbar(id);
                                }}
                                onDoubleClick={(
                                    event,
                                ) => {
                                    event.stopPropagation();

                                    if (isText) {
                                        startEditing(component, "text");
                                    } else if (type === "button" || type === "badge") {
                                        startEditing(
                                            component,
                                            type === "button" ? "label" : "label",
                                            String(
                                                component.props?.label ??
                                                component.props?.actionText ??
                                                component.name ??
                                                "",
                                            ),
                                        );
                                    }
                                }}
                            >
                                {isText ? (
                                    editing ? (
                                        <div className="relative h-full w-full rounded-lg border border-violet-400 bg-[#18152a] p-3 shadow-lg">
                                            <textarea
                                                autoFocus
                                                value={
                                                    editingText
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setEditingText(
                                                        event.target
                                                            .value,
                                                    )
                                                }
                                                onPointerDown={(
                                                    event,
                                                ) =>
                                                    event.stopPropagation()
                                                }
                                                onKeyDown={(
                                                    event,
                                                ) => {
                                                    if (
                                                        event.key ===
                                                        "Escape"
                                                    ) {
                                                        cancelEditing();
                                                    }

                                                    if (
                                                        event.key ===
                                                        "Enter" &&
                                                        (event.metaKey ||
                                                            event.ctrlKey)
                                                    ) {
                                                        finishEditing();
                                                    }
                                                }}
                                                className="h-full w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/30"
                                                placeholder="Type your text…"
                                            />

                                            <div className="absolute -bottom-9 left-0 flex items-center gap-1 rounded-lg border border-white/10 bg-[#11121d] p-1 shadow-lg">
                                                <button
                                                    type="button"
                                                    onClick={
                                                        finishEditing
                                                    }
                                                    className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] text-emerald-300 hover:bg-emerald-400/10"
                                                >
                                                    <Check
                                                        size={11}
                                                    />
                                                    Done
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        cancelEditing
                                                    }
                                                    className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] text-white/50 hover:bg-white/5 hover:text-white"
                                                >
                                                    <X size={11} />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`flex h-full w-full items-center rounded-lg border px-3 text-sm leading-5 ${selected
                                                ? "border-violet-400/60 bg-violet-500/10 text-white"
                                                : "border-white/10 bg-white/[0.03] text-white/70"
                                                }`}
                                        >
                                            {text}
                                        </div>
                                    )
                                ) : isShape ? (
                                    <div
                                        className="h-full w-full"
                                        style={{
                                            boxSizing: "border-box",
                                            backgroundColor: selected
                                                ? "rgba(139, 92, 246, 0.14)"
                                                : "rgba(255, 255, 255, 0.06)",
                                            border:
                                                shapeType === "line"
                                                    ? "none"
                                                    : `2px solid ${selected
                                                        ? "rgb(167, 139, 250)"
                                                        : "rgba(255, 255, 255, 0.55)"
                                                    }`,
                                            borderRadius:
                                                shapeType === "circle"
                                                    ? "50%"
                                                    : shapeType === "pill"
                                                        ? "9999px"
                                                        : shapeType === "rounded"
                                                            ? "14px"
                                                            : "0px",
                                            ...(shapeType === "line"
                                                ? {
                                                    height: "3px",
                                                    minHeight: "3px",
                                                    backgroundColor: selected
                                                        ? "rgb(167, 139, 250)"
                                                        : "rgba(255, 255, 255, 0.75)",
                                                }
                                                : {}),
                                        }}
                                    />
                                ) : type === "button" ? (
                                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-md">
                                        {renderEditableField(
                                            component,
                                            "label",
                                            component.props?.label || component.props?.actionText || "Button",
                                            "text-sm font-semibold text-white",
                                        )}
                                    </div>
                                ) : type === "card" ? (
                                    <div className="flex h-full w-full flex-col justify-center rounded-xl border border-white/15 bg-[#202133] p-4 shadow-md">
                                        {renderEditableField(
                                            component,
                                            "title",
                                            component.props?.title || "Card Title",
                                            "text-sm font-semibold text-white",
                                        )}
                                        {renderEditableField(
                                            component,
                                            "subtitle",
                                            component.props?.subtitle || "Card content",
                                            "mt-1 text-xs text-white/60",
                                        )}
                                    </div>
                                ) : type === "input" ? (
                                    <div className="flex h-full w-full flex-col justify-center gap-2 rounded-xl border border-white/10 bg-[#202133] p-3">
                                        {renderEditableField(
                                            component,
                                            "label",
                                            component.props?.label || "Input",
                                            "text-xs font-medium text-white/80",
                                        )}
                                        <div className="flex h-9 items-center rounded-lg border border-white/20 bg-black/20 px-3 text-xs text-white/40">
                                            {renderEditableField(
                                                component,
                                                "placeholder",
                                                component.props?.placeholder || "Enter text...",
                                                "text-xs text-white/40",
                                            )}
                                        </div>
                                    </div>
                                ) : type === "badge" ? (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <span className="rounded-full bg-violet-500/20 px-4 py-2 text-xs font-semibold text-violet-200 ring-1 ring-violet-400/40">
                                            {renderEditableField(
                                                component,
                                                "label",
                                                component.props?.label || "Badge",
                                                "text-xs font-semibold text-violet-200",
                                            )}
                                        </span>
                                    </div>
                                ) : type === "avatar" ? (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500 text-lg font-semibold text-white ring-4 ring-violet-500/15">
                                            {renderEditableField(
                                                component,
                                                "title",
                                                String(component.props?.title || "A").slice(0, 2),
                                                "text-lg font-semibold text-white",
                                            )}
                                        </div>
                                    </div>
                                ) : type === "list" ? (
                                    <div className="flex h-full w-full flex-col gap-2 overflow-visible rounded-xl border border-white/10 bg-[#202133] p-3 shadow-md">
                                        <div className="shrink-0">
                                            {renderEditableField(
                                                component,
                                                "title",
                                                component.props?.title || "List",
                                                "text-sm font-semibold text-white",
                                            )}
                                        </div>
                                        <div className="flex min-h-0 flex-1 flex-col">
                                            {(Array.isArray(component.props?.items) ? component.props.items : []).map(
                                                (listItem: any, itemIndex: number) => (
                                                    <div
                                                        key={itemIndex}
                                                        className="group flex min-h-[30px] items-center gap-2 border-b border-white/10 py-1.5 last:border-0"
                                                    >
                                                        <div className="h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                                                        <div className="min-w-0 flex-1 text-xs text-white/70">
                                                            {renderEditableField(
                                                                component,
                                                                `item-${itemIndex}`,
                                                                listItem?.title || `List Item ${itemIndex + 1}`,
                                                                "text-xs text-white/70",
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            title="Remove list item"
                                                            aria-label={`Remove list item ${itemIndex + 1}`}
                                                            onPointerDown={(event) => event.stopPropagation()}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                removeListItem(component, itemIndex);
                                                            }}
                                                            className="shrink-0 rounded px-1 text-[10px] text-white/30 opacity-0 hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onPointerDown={(event) => event.stopPropagation()}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                addListItem(component);
                                            }}
                                            className="mt-1 shrink-0 self-start rounded-md px-2 py-1 text-[10px] font-medium text-violet-300 hover:bg-violet-500/10"
                                        >
                                            + Add item
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex h-full w-full items-center rounded-xl border border-white/10 bg-[#202133] px-4">
                                        <span className="text-xs text-white/70">{text}</span>
                                    </div>
                                )}
                            </div>

                            {/* RESIZE */}

                            {selected && (
                                <button
                                    type="button"
                                    aria-label="Resize element"
                                    title="Drag to resize"
                                    className="absolute -bottom-2 -right-2 z-50 h-4 w-4 cursor-se-resize rounded-sm border border-violet-300 bg-violet-500 shadow-lg"
                                    onPointerDown={(
                                        event,
                                    ) =>
                                        beginResize(
                                            event,
                                            component,
                                        )
                                    }
                                />
                            )}
                        </div>
                    );
                },
            )}
        </div>
    );
}
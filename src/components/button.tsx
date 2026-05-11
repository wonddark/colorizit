import type {ReactNode} from "react";

type Props = {
    children: ReactNode
    variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "accent"
    size?: "sm" | "md" | "lg"
    className?: string
}

function Button(props: Readonly<Props>) {
    const {children, variant = "default", size = "md", className=""} = props;
    return (
        <button className={buildClasses({variant, size, className})}>{children}</button>
    )
}

function buildClasses(props: Readonly<Pick<Props, "variant" | "size"|"className">>) {
    let base = "flex cursor-pointer items-center justify-center py-1.5 px-3.5 font-medium rounded-md text-sm hover:brightness-105 transition-all duration-200 ease-in-out active:scale-97 active:brightness-110"

    switch (props.variant) {
        case "secondary":
            base += " bg-(--g7) text-(--g12)";
            break;
        case "outline":
            base += " border border-(--p9) text-(--p9)";
            break;
        case "ghost":
            base += " text-(--g11) hover:bg-(--g3)";
            break;
        case "link":
            base += " text-(--p10) hover:bg-(--g3)";
            break;
        case "accent":
            base += " text-(--c12) bg-(--c9)";
            break;
        default:
            base += " bg-(--p9) text-(--p12)";
    }

    switch (props.size) {
        case "sm":
            base += " py-1 px-2.5 text-xs";
            break;
        case "lg":
            base += " py-2 px-4.5";
            break;
        default:
            base += " py-1.5 px-3.5 text-sm";
    }

    return base + " " + props.className;
}

export default Button

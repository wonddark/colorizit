import type {ReactNode} from "react";

type Props = {
    children: ReactNode;
    className?: string;
}

function Card(props: Readonly<Props>) {
    const {children, className = ""} = props;
    const base = "rounded-xl bg-(--g2) border border-(--g6) flex flex-col p-4";
    return (
        <div className={base + " " + className}>{children}</div>
    )
}

export default Card

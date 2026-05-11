import type {DetailedHTMLProps, TextareaHTMLAttributes} from "react";

type Props =
    DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>
    & {
    className?: string; placeholder?: string; label?: string;
}

function Textarea(props: Readonly<Props>) {
    const {className, ...rest} = props;
    const base = "border border-(--g7) flex-auto transition-colors rounded-md" +
        " ease-in-out duration-200 text-sm py-2 px-2.5 focus:outline-1 outline-(--p7)" +
        " focus-visible:outline-1 focus-within:outline-1 focus:ring-2 focus-visible:ring-2" +
        " focus-within:ring-2 placeholder:text-(--g8) focus:bg-(--g3) focus-within:bg-(--g3)" +
        " focus-visible:bg-(--g3) min-h-[100px] ring-(--p7) ring-opacity-50";
    return (
        <textarea className={base + " " + className} {...rest} />
    )
}

export default Textarea

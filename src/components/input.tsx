import type {DetailedHTMLProps, InputHTMLAttributes} from "react";

type Props =
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
    & {
    className?: string; placeholder?: string; label?: string;
}

function Input(props: Readonly<Props>) {
    const {className, placeholder, label, ...rest} = props;
    let base = "border border-(--g7) flex-auto transition-colors rounded-md ease-in-out duration-200 text-sm py-2 px-2.5 focus:outline-0 focus-visible:outline-0 focus-within:outline-0 focus:ring-0 focus-visible:ring-0 focus-within:ring-0 placeholder:text-(--g8) focus:bg-(--g3) focus-within:bg-(--g3) focus-visible:bg-(--g3)"
    base += props.label ?  " rounded-l-none border-l-0" : "";
    return (
        <div className="flex rounded-md has-focus:outline-1 has-focus-visible:outline-1 has-focus-within:outline-1 has-focus:ring-2 outline-(--p7) has-focus-visible:ring-2 ring-(--p7) ring-opacity-50 has-focus-within:ring-2">
            {label ? <label htmlFor={props.id} className="rounded-l-md text-xs px-3 bg-(--g5) text-(--g11) inline-flex items-center justify-center">{label}</label> : null}
            <input type="text"
                   placeholder={placeholder}
                   className={base + " " + className} {...rest} />
        </div>
    )
}

export default Input

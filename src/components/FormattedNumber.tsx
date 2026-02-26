export const FormattedPrice = ({ price }: { price: number }) => {
    return <span>${price.toLocaleString()}</span>;
}

export const FormattedNumber = ({ number }: { number: number }) => {
    return <span>{number.toLocaleString()}</span>;
}

export const FormattedPercentage = ({ percentage }: { percentage: number }) => {
    return <span>{percentage.toLocaleString()}%</span>;
}

export const FormattedTime = ({ timeSeconds }: { timeSeconds: number }) => {
    return <span>{new Date(timeSeconds * 1000).toLocaleString()}</span>;
}

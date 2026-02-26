export const FormattedPrice = ({ price }: { price: number }) => {
    if(!price) return <span>-</span>;
    return <span>{formatNumber(price)}</span>;
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

function formatNumber(number: number): string {
    if (number >= 1_000_000_000) {
        return formatNumberWith(number, 1_000_000_000, 'B');
    }
    if (number >= 1_000_000) {
        return formatNumberWith(number, 1_000_000, 'M');
    }
    if (number >= 1_000) {
        return formatNumberWith(number, 1_000, 'K');
    }
    return formatNumberWith(number, 1, '');
}

function formatNumberWith(number: number, div: number, unit: string): string {
    const millionsDec = number / div;
    const millionsInt = Math.floor(millionsDec);
    const lenth = `${millionsInt}`.length;
    const decimals = 3 - lenth;
    return '$' + (millionsDec).toFixed(decimals) + unit;
}
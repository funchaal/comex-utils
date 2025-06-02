export default function formatJsonReadable(arr, indent = 2) {
        let result = '';

        function capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }

        function recurse(current, currentIndent) {
            if (Array.isArray(current)) {
            current.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                recurse(item, currentIndent);
                } else {
                result += `${' '.repeat(currentIndent)}${item}\n`;
                }
            });
            } else if (typeof current === 'object' && current !== null) {
            for (const key in current) {
                const value = current[key];
                if (typeof value === 'object' && value !== null) {
                result += `${' '.repeat(currentIndent)}${capitalize(key)}:\n`;
                recurse(value, currentIndent + indent);
                } else {
                result += `${' '.repeat(currentIndent)}${capitalize(key)}: ${value}\n`;
                }
            }
            } else {
            result += `${' '.repeat(currentIndent)}${current}\n`;
            }
        }

        arr.forEach((item, i) => {
            recurse(item, 0);
            if (i !== arr.length - 1) {
            result += '\n'; // espaço duplo só entre os itens do array principal
            }
        });

        return result;
        }
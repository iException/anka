const space = '  '

export default function (infos = []) {
    return `${space}Information:\r\n\r\n` +
        infos.map(info => {
            return space.repeat(2) + info.group + '\r\n' +
                info.messages.map(m => space.repeat(3) + m + '\r\n').join('\r\n')
        }).join('\r\n')
}

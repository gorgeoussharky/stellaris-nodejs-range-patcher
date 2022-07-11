import fs from 'fs'
import RE2 from 're2'
import { emptyDirSync } from 'fs-extra'

// Main constants
const rangeModifier = 6

// Clear dist folter
emptyDirSync('./distFiles')

const getComponentGroup = (data, groupKey) => {
    const bracketsRegex = '\\{[\\s\\S]*?\\n\\}'
    const group = new RE2(`${groupKey} = ${bracketsRegex}`, 'mgi')
    const componentsArray = data.match(group)

    return componentsArray
}

const getComponentKey = (component) => {
    const componentKeyRegex = new RE2('key = (.+)', 'gi')
    const componentKey = componentKeyRegex
        .exec(component)[1]
        .trim()
        .replace(/\"/g, '')

    return componentKey
}

const replaceRanges = (component) => {
    // range RE includes min_range and missile_retarget_range
    const rangesKeys = ['range']

    rangesKeys.forEach((rangeKey) => {
        const rangeRE = new RE2(`${rangeKey} = ([0-9]+)`, 'gi')

        component = component.replace(rangeRE, (match, offset, input) => {
            const range = parseInt(offset)
            const newRange = ~~(range / rangeModifier)

            // No zeroes!
            if (newRange < 1) {
                newRange = 1
            }

            return `${rangeKey} = ${newRange}`
        })
    })

    return component
}

const fixAndWriteComponents = (components) => {
    components.forEach((component) => {
        // get component name
        const name = getComponentKey(component)

        // Replace ranges
        const fixedComponent = replaceRanges(component)

        // create separate file for every component
        fs.writeFile(`./distFiles/!!!_${name}.txt`, fixedComponent, (err) => {
            if (err) console.log(err)
        })
    })
}

fs.readdir('./srcFiles/', (err, files) => {
    if (err) {
        console.log(err)
        return
    }
    files.forEach((file) => {
        fs.readFile(
            `./srcFiles/${file}`,
            { encoding: 'utf-8' },
            (err, contents) => {
                if (!err) {
                    // Get all components from specific group (example: weapon_component_template)

                    const weapons = getComponentGroup(
                        contents,
                        'weapon_component_template'
                    )

                    const strikecrafts = getComponentGroup(
                        contents,
                        'strike_craft_component_template'
                    )

                    fixAndWriteComponents(weapons)
                    fixAndWriteComponents(strikecrafts)

                } else {
                    console.log(err)
                }
            }
        )
    })
})

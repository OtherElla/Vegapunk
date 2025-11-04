import { tech_brawl, tech_special } from './techniques.js';

// Track which source each technique comes from
const tech_sources = {};
for (const tech_name in tech_brawl) {
    tech_sources[tech_name] = "Brawl";
}
for (const tech_name in tech_special) {
    tech_sources[tech_name] = "Special";
}

// Combine all techniques into one dictionary
const all_techniques = {
    ...tech_brawl,
    ...tech_special
};

// Sort techniques by tier and classification
function getSortedTechniques() {
    const sorted_techniques = {};
    const tiers = [...new Set(Object.values(all_techniques).map(tech => tech.tier))].sort();

    for (const tier of tiers) {
        const classifications = [...new Set(
            Object.values(all_techniques)
                .filter(tech => tech.tier === tier)
                .map(tech => tech.classification)
        )].sort();

        sorted_techniques[tier] = {};
        for (const classification of classifications) {
            sorted_techniques[tier][classification] = Object.entries(all_techniques)
                .filter(([_, tech_data]) => 
                    tech_data.tier === tier && 
                    tech_data.classification === classification
                )
                .map(([tech_name]) => tech_name)
                .sort();
        }
    }
    return sorted_techniques;
}

// Similarity function for fuzzy matching
function similarity(a, b) {
    if (a === b) return 3.0;
    if (b.startsWith(a)) return 2.5;
    if (b.includes(a)) return 2.0 - (b.indexOf(a) / b.length);
    
    let match_chars = 0;
    const min_length = Math.min(a.length, b.length);
    for (let i = 0; i < min_length; i++) {
        if (a[i] === b[i]) match_chars++;
    }
    return match_chars / Math.max(a.length, b.length);
}

// Helper function to format technique names
function formatTechniqueName(name) {
    return name.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Function to build technique details embed
function buildTechniqueEmbed(tech_name, tech_data) {
    const title = formatTechniqueName(tech_name);
    const source = tech_sources[tech_name] || "Unknown";
    
    let description = [
        `**Source:** ${source}`,
        `**Tier:** ${tech_data.tier}`,
        `**Casting Time:** ${tech_data.casting_time}`,
        `**Range:** ${tech_data.range}`,
        `**Duration:** ${tech_data.duration}`,
        `**Cost:** ${tech_data.cost}`,
        `**Keywords:** ${tech_data.keywords}`,
        "",
        `**Description:** ${tech_data.description}`
    ];

    // Add effects if present
    if (tech_data.effects) {
        description.push("");
        if (tech_data.effects.success) {
            description.push(`**On Success:** ${tech_data.effects.success}`);
        }
        if (tech_data.effects.failure) {
            description.push(`**On Failure:** ${tech_data.effects.failure}`);
        }
        if (tech_data.effects.critical_failure) {
            description.push(`**On Critical Failure:** ${tech_data.effects.critical_failure}`);
        }
    }

    // Add higher ranks/levels information if present
    if (tech_data.higher_ranks) {
        description.push("", `**At Higher Ranks:** ${tech_data.higher_ranks}`);
    } else if (tech_data.higher_levels) {
        description.push("", `**At Higher Levels:** ${tech_data.higher_levels}`);
    }

    return {
        type: 4,
        data: {
            embeds: [{
                title: title,
                description: description.join('\n'),
                color: 0x00ff00
            }]
        }
    };
}

// Function to build summary embed
function buildSummaryEmbed() {
    const sorted_techniques = getSortedTechniques();
    const summary_lines = ["**Technique Summary**\n"];

    // Count by tier
    summary_lines.push("**By Tier:**");
    for (const tier in sorted_techniques) {
        const count = Object.values(sorted_techniques[tier])
            .reduce((sum, techs) => sum + techs.length, 0);
        summary_lines.push(`  ${tier}: ${count} techniques`);
    }

    // Count by source
    const source_counts = {};
    for (const [tech_name, source] of Object.entries(tech_sources)) {
        source_counts[source] = (source_counts[source] || 0) + 1;
    }

    summary_lines.push("\n**By Source:**");
    for (const [source, count] of Object.entries(source_counts).sort()) {
        summary_lines.push(`  ${source}: ${count} techniques`);
    }

    summary_lines.push(`\n**Total Techniques:** ${Object.keys(all_techniques).length}`);

    return {
        type: 4,
        data: {
            embeds: [{
                title: "Technique Database Summary",
                description: summary_lines.join('\n'),
                color: 0x00ff00
            }]
        }
    };
}

// Function to build technique list embed
function buildTechniqueListEmbed(source_filter = null) {
    const sorted_techniques = getSortedTechniques();
    const available_techniques = [];

    for (const tier in sorted_techniques) {
        const tier_techs = [];
        for (const classification in sorted_techniques[tier]) {
            // Filter by source if specified
            const techs = source_filter
                ? sorted_techniques[tier][classification]
                    .filter(tech => tech_sources[tech].toLowerCase() === source_filter.toLowerCase())
                : sorted_techniques[tier][classification];

            tier_techs.push(...techs);
        }

        if (tier_techs.length > 0) {
            const tech_list = tier_techs
                .map(t => formatTechniqueName(t))
                .join(", ");
            available_techniques.push(`**${tier}:** ${tech_list}`);
        }
    }

    if (available_techniques.length === 0 && source_filter) {
        const available_sources = [...new Set(Object.values(tech_sources))].join(", ");
        return {
            type: 4,
            data: {
                embeds: [{
                    title: "No Techniques Found",
                    description: `No techniques found for source: ${source_filter}. Available sources: ${available_sources}`,
                    color: 0xff0000
                }]
            }
        };
    }

    let available = available_techniques.join('\n');
    if (available.length > 2000) {
        available = available.slice(0, 1997) + "...";
        available += "\n\n*List truncated due to length. Use source filters to see specific techniques.*";
    }

    const title = source_filter
        ? `Available Techniques (Source: ${source_filter.charAt(0).toUpperCase() + source_filter.slice(1)})`
        : "Available Techniques";

    return {
        type: 4,
        data: {
            embeds: [{
                title: title,
                description: available,
                color: 0x00ff00
            }]
        }
    };
}

// Build paginated list pages and return a specific page response
function buildTechniqueListPageResponse(source_filter = null, page = 1) {
    // Build ordered lists: Brawl then Special
    const brawl = Object.keys(tech_brawl).filter(k => !source_filter || source_filter.toLowerCase() === 'brawl');
    const special = Object.keys(tech_special).filter(k => !source_filter || source_filter.toLowerCase() === 'special');

    // Format into lines
    const lines = [];
    if (brawl.length) {
        lines.push('**Brawl:**');
        brawl.sort().forEach(t => lines.push(`- ${formatTechniqueName(t)}`));
        lines.push('');
    }
    if (special.length) {
        lines.push('**Special:**');
        special.sort().forEach(t => lines.push(`- ${formatTechniqueName(t)}`));
    }

    if (lines.length === 0) {
        return {
            type: 4,
            data: {
                embeds: [{ title: 'No Techniques', description: 'No techniques found for that filter.', color: 0xff0000 }]
            }
        };
    }

    const pageSize = 10; // lines per page
    const pages = [];
    for (let i = 0; i < lines.length; i += pageSize) {
        pages.push(lines.slice(i, i + pageSize).join('\n'));
    }

    const total = pages.length;
    const current = Math.max(1, Math.min(page, total));

    // Build components (buttons) using raw types so worker doesn't need discord libs
    const filterKey = source_filter ? source_filter.toLowerCase() : 'all';
    const components = [{
        type: 1,
        components: [
            { type: 2, style: 2, custom_id: `tech_list_prev:${filterKey}:${current}`, label: 'Prev', disabled: current <= 1 },
            { type: 2, style: 2, custom_id: `tech_list_next:${filterKey}:${current}`, label: 'Next', disabled: current >= total },
        ]
    }];

    return {
        type: 4,
        data: {
            embeds: [{
                title: source_filter ? `Techniques (filter: ${source_filter})` : 'Techniques',
                description: pages[current - 1],
                footer: { text: `Page ${current} of ${total}` },
                color: 0x00ff00
            }],
            components
        }
    };
}

// Main function to handle technique commands
function handleTechniqueCommand(args) {
    if (!args || args.length === 0) {
        return {
            type: 4,
            data: {
                embeds: [{
                    title: "Technique Command",
                    description: "Usage:\n" +
                        "`/technique <technique name>` - Search all tiers for technique\n" +
                        "`/technique <tier> <technique name>` - Show technique from specific tier\n" +
                        "`/technique list` - View all techniques\n" +
                        "`/technique list <source>` - View techniques from specific source\n" +
                        "`/technique summary` - Show technique count summary",
                    color: 0x00ff00
                }]
            }
        };
    }

    const command = args[0].toLowerCase();

    // Handle summary command
    if (command === "summary") {
        return buildSummaryEmbed();
    }

    // Handle list command
    if (command === "list") {
        const source_filter = args.length > 1 ? args[1].toLowerCase() : null;
        // return first page
        return buildTechniqueListPageResponse(source_filter, 1);
    }

    // show subcommand: /technique show <name>
    if (command === 'show') {
        const nameArg = args.length > 1 ? args.slice(1).join(' ').toLowerCase() : null;
        if (!nameArg) {
            return {
                type: 4,
                data: { embeds: [{ title: 'Usage', description: '`/technique show <technique name>`', color: 0xff0000 }] }
            };
        }

        let closest = null;
        let bestScore = -1;
        for (const tech_name in all_techniques) {
            const sc = similarity(nameArg, tech_name.toLowerCase());
            if (sc > bestScore) {
                bestScore = sc;
                closest = tech_name;
            }
        }
        if (closest && bestScore >= 0.4) {
            return buildTechniqueEmbed(closest, all_techniques[closest]);
        }
        return {
            type: 4,
            data: { embeds: [{ title: 'Not Found', description: `No technique matching "${nameArg}" found.`, color: 0xff0000 }] }
        };
    }

    // Handle single argument (search across all tiers)
    if (args.length === 1) {
        const input_tech = command;
        let closest_tech = null;
        let highest_score = -1.0;

        for (const tech_name in all_techniques) {
            const score = similarity(input_tech, tech_name.toLowerCase());
            if (score > highest_score) {
                highest_score = score;
                closest_tech = tech_name;
            }
        }

        if (highest_score >= 0.5) {
            return buildTechniqueEmbed(closest_tech, all_techniques[closest_tech]);
        } else {
            return {
                type: 4,
                data: {
                    embeds: [{
                        title: "Technique Not Found",
                        description: `No technique matching "${input_tech}" found. Try \`/technique list\` to see all available techniques.`,
                        color: 0xff0000
                    }]
                }
            };
        }
    }

    // Handle two or more arguments (tier + technique name)
    const level_input = command;
    const input_tech = args.slice(1).join(" ").toLowerCase();
    let closest_tech = null;
    let highest_score = -1.0;

    // Find the best matching technique for the given tier
    for (const [tech_name, tech_data] of Object.entries(all_techniques)) {
        if (tech_data.tier.toLowerCase() === level_input) {
            const score = similarity(input_tech, tech_name.toLowerCase());
            if (score > highest_score) {
                highest_score = score;
                closest_tech = tech_name;
            }
        }
    }

    if (highest_score >= 0.5) {
        return buildTechniqueEmbed(closest_tech, all_techniques[closest_tech]);
    }

    // Get all techniques for the specified tier
    const sorted_techniques = getSortedTechniques();
    const matching_tier = Object.keys(sorted_techniques)
        .find(tier => tier.toLowerCase() === level_input);

    if (matching_tier) {
        const tier_techs = [];
        for (const classification in sorted_techniques[matching_tier]) {
            tier_techs.push(...sorted_techniques[matching_tier][classification]);
        }
        const available = tier_techs
            .map(tech => tech.charAt(0).toUpperCase() + tech.slice(1))
            .join(", ");

        return {
            type: 4,
            data: {
                embeds: [{
                    title: "Technique Not Recognized or Incorrect Level",
                    description: `Available techniques for ${matching_tier} are: ${available}.`,
                    color: 0xff0000
                }]
            }
        };
    } else {
        const available_tiers = Object.keys(sorted_techniques).join(", ");
        return {
            type: 4,
            data: {
                embeds: [{
                    title: "Invalid Tier",
                    description: `Available tiers are: ${available_tiers}`,
                    color: 0xff0000
                }]
            }
        };
    }
}

export {
    handleTechniqueCommand,
    buildTechniqueListPageResponse
};
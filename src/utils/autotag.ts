import type { Tag } from '../types';

/**
 * Keyword-based dictionary for 100% offline, free, and tokenless auto-tagging.
 */
const KEYWORD_MAP: Record<string, string[]> = {
    'b_routine': ['every day', 'daily', 'routine', 'usually', 'always', 'habit'],
    'b_workaround': ['excel', 'spreadsheet', 'manually', 'copy paste', 'hack', 'workaround'],
    'm_efficiency': ['faster', 'save time', 'quick', 'speed up'],
    'm_control': ['export', 'see everything', 'control', 'customize'],
    'm_safety': ['backup', 'safe', 'lose data', 'secure', 'privacy'],
    'f_time': ['took too long', 'slow', 'wait', 'hours', 'waste of time'],
    'f_usability': ['confusing', 'hard to find', 'clunky', 'where is', 'complicated', 'difficult'],
    'f_cost': ['expensive', 'too much', 'price', 'budget', 'cost'],
    'i_churn': ['cancel', 'stop using', 'alternative', 'switch'],
    'i_support': ['call support', 'help desk', 'ticket', 'contact support']
};

export function autoTagNote(noteText: string, existingTags: Tag[]): string[] {
    const matchedTagIds = new Set<string>();
    const textLower = noteText.toLowerCase();

    // Check predefined generic categories
    for (const [tagId, keywords] of Object.entries(KEYWORD_MAP)) {
        for (const word of keywords) {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            if (regex.test(textLower)) {
                matchedTagIds.add(tagId);
                break;
            }
        }
    }

    // Also check dynamic custom tags created by the user
    existingTags.forEach(tag => {
        // Only auto-tag if the custom tag name is relatively distinct (length > 3)
        if (tag.name.length > 3) {
            const regex = new RegExp(`\\b${tag.name.toLowerCase()}\\b`, 'i');
            if (regex.test(textLower)) {
                matchedTagIds.add(tag.id);
            }
        }
    });

    return Array.from(matchedTagIds);
}

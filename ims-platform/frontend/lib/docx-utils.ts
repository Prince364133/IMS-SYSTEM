import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

/**
 * Generates a DOCX Blob from basic document data.
 * Since we don't have a direct HTML->DOCX converter, we map the known structures.
 */
export async function generateDOCX(title: string, html: string): Promise<Blob> {
    // Simple HTML to text extraction for basic content
    // In a real scenario, we'd use a more complex parser if needed.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Extract paragraphs, avoiding scripts/styles
    const contentNodes = Array.from(tempDiv.querySelectorAll('h1, h2, h3, p, table'));

    const children: any[] = [
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }),
    ];

    contentNodes.forEach(node => {
        if (node.tagName === 'H2') {
            children.push(new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }));
        } else if (node.tagName === 'H3') {
            children.push(new Paragraph({ text: node.textContent || '', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
        } else if (node.tagName === 'P') {
            children.push(new Paragraph({ text: node.textContent || '', spacing: { after: 200 } }));
        } else if (node.tagName === 'TABLE') {
            const rows = Array.from(node.querySelectorAll('tr')).map(tr => {
                return new TableRow({
                    children: Array.from(tr.querySelectorAll('th, td')).map(td => {
                        return new TableCell({
                            children: [new Paragraph({ text: td.textContent || '' })],
                            width: { size: 100 / tr.children.length, type: WidthType.PERCENTAGE },
                        });
                    }),
                });
            });
            children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children,
        }],
    });

    return await Packer.toBlob(doc);
}

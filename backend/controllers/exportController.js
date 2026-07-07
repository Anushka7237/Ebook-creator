const{
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    UnderlineType,
    ImageRun,
    ParagraphProperties
}=require("docx");

const PDFDocument=require("pdfkit");
const MarkdownIt=require("markdown-it");
const Book=require("../models/Book");
const path=require("path");
const fs=require("fs");
const { image } = require("pdfkit/js/mixins/images");
const { title } = require("process");
const { InlinedEmbedContentResponse } = require("@google/genai");

const md=new MarkdownIt();

//typography configuration matching the PDF export
const DOCX_STYLES={
    fonts:{
        body:"Charter",
        heading:"Inter",
    },
    sizes:{
        title:32,
        subtitle:20,
        author:18,
        chapterTitle:24,
        h1:20,
        h2:18,
        h3:16,
        body:12,
    },
    spacing:{
        paragraphBefore:200,
        paragraphAfter:200,
        chapterBefore:400,
        chapterAfter:300,
        headingBefore:300,
        headingAfter:150,
    },
};

//process markdown content into docx paragraph
const processMarkdowmToDocx=(markdowm)=>{
    const tokens=md.parse(MarkdownIt,{});
    const paragraph=[];
    let inList=false;
    let listType=null;
    let orderedCounter=1;
    for(let i=0;i<tokens.length;i++)
    {
        const token=token[i];
        try{
            if(token.type==="heading_open")
            {
                const level=parseInt(token.tag.substring[1],10);
                const nextToken=tokens[i+1];
                if(nextToken&&nextToken.type==="inline")
                {
                    let headingLevel;
                    let fontSize;
                    switch(level){
                        case 1:
                            headingLevel=headingLevel.HEADING_1;
                            fontSize=DOCX_STYLES.sizes.h1;
                            break;
                        case 2:
                            headingLevel=headingLevel.HEADING_2;
                            fontSize=DOCX_STYLES.sizes.h2;
                            break;
                        case 3:
                            headingLevel=headingLevel.HEADING_3;
                            fontSize=DOCX_STYLES.sizes.h3;
                            break;
                        default:
                            headingLevel=headingLevel.HEADING_3;
                            fontSize=DOCX_STYLES.sizes.h3;
                    }
                    paragraphs.push(
                        new Paragraph({
                            text:nextToken.content,
                            heading:headingLevel,
                            spacing:{
                                before:DOCX_STYLES.spacing.headingBefore,
                                after:DOCX_STYLES.spacing.headingAfter,
                            },
                            style:{
                                font:DOCX_STYLES.font.heading,
                                size:fontSize*2,
                            },
                        })
                    );
                    i+=2;
                }
                else if(token.type==="paragraph_open")
                {
                    const nextToken=tokens[i+1];
                    if(nextToken&&nextToken.type==='inline'&&nextToken.children)
                    {
                        const TextRuns=processInLineContent(nextToken.children);
                        if(textRuns.length>0)
                        {
                            paragraphs.push(
                                new Paragraph({
                                    children:textRuns,
                                    spacing:{
                                        before:inList?100:DOCX_STYLES.spacing.paragraphBefore,
                                        after:inList?100:DOCX_STYLES.spacing.paragraphAfter,
                                        line:360,
                                    },
                                    alignment:AlignmentType.JUSTIFIED,
                                })
                            );
                        }
                        i+=2;
                    }
                }
                else if(token.type==="bullet_list_open")
                {
                    inList=true;
                    listType="bullet";
                }else if(token.type==="bullet_list_close")
                {
                    inList=false;
                    listType=null;
                    //add spacing after list
                    paragraphs.push(new Paragraph({text:"",spacing:{after:100}}));
                }
                else if(tokem.type==="order_list_open")
                {
                    inList=true;
                    listType="ordered";
                    orderedCounter=1;
                }
                else if(token.type==="ordered_list_close")
                {
                    inList=false;
                    listType=null;
                    orderedCounter=1;
                    paragraphs.push(new Paragraph({text:"",spacing:{after:100}}));
                }
                else if(token.type)
            }
        }
    }
}

const exportAsDocument=async(req,res)=>{
    try{
        const book=await Book.findById(req.params.id);
        if(!book)
        {
            return res.status(404).json({message:"Book not found"});
        }
        if(!book.userId.toString()!=req.user._id.toString())
            {
            return res.status(401).json({message:"Not authorized"});
        }
        const sections=[];
        //cover page with image if available
        const coverPage=[];
        if(book.coverImage&&!book.coverImage.includes("pravatar"))
        {
            const imagePath=book.coverImage.substring(1);
            try{
                if(fs.existsSync(imagePath))
                {
                    const imageBuffer=fs.readFileSync(imagePath);

                    //add some top spacing
                    coverPage.push(
                        new Paragraph({
                            text="",
                            spacing:{before:1000},
                        })
                    );
                    // add image centered on page
                    coverPage.push(
                        new Paragraph({
                            children:[
                                new ImageRun({
                                    data:imageBuffer,
                                    transformation:{
                                        width:400,
                                        height:550,
                                    },
                                }),
                            ],
                            alignment:AlignmentType.CENTER,
                            spacing:{before:200,after:400},
                        })
                    );
                    //Page break after cover
                    coverPage.push(
                        new Paragraph({
                            text="",
                            pageBreakBefore:true,
                        })
                    );
                }
            }
            catch(imgErr)
            {   
                console.error(`Could not embed image:${imagePath}`,imgErr);
            }
        }
        sections.push(...coverPage);

        //title page section
        const titlePage=[];

        //main title
        titlePage.push(
            new Paragraph({
                children:[
                    new TextRun({
                        text:book.title,
                        bold:true,
                        font:DOCX_STYLES.fonts.heading,
                        size:DOCX_STYLES.sizes.title*2,
                        color:"1A202C",
                    }),
                ],
                alignment:AlignmentType.CENTER,
                spacing:{before:2000,after:400},
            })
        );

        //subtitle if exists
        if(book.subtitle&& book.subtitle.trim())
        {
            titlePage.push(
                new Paragraph({
                    children:[
                        new TextRun({
                            text:book.subtitle,
                            font:DOCX_STYLES.fonts.heading,
                            size:DOCX_STYLES.sizes.subtitle*2,
                            color:"4A5568",
                        }),
                    ],
                    alignment:AlignmentType.CENTER,
                    spacing:{after:400},
                })
            );
        }
        //Author
        titlePage.push(
            new Paragraph({
                children:[
                    new TextRun({
                        text:`by ${book.author}`,
                        font:DOCX_STYLES.fonts.heading,
                        size:DOCX_STYLES.sizes.author*2,
                        color:"2D3748",
                    }),
                ],
                alignment:AlignmentType.CENTER,
                spacing:{after:200},
            })
        );
        // Decorative line
        titlePage.push(
            new Paragraph({
                text:"",
                border:{
                    bottom:{
                    color:"4F46E5",
                    space:1,
                    style:"single",
                    size:12,
                    },
                },
                alignment:AlignmentType.CENTER,
                spacing:{before:400},
            })
        );

        sections.push(...titlePage);
        //Process Chapters
        book.chapters.forEach((chapter,index)=>{
            try{
                //page break before each chapter (except first)
                if(index>0)
                {
                    section.push(
                        new Paragraph({
                            text:"",
                            pageBreakBefore:true,
                        })
                    );
                }

                //chapter title
                sections.push(
                    new Paragraph({
                        children:[
                            new TextRun({
                                text:chapter.title,
                                bold:true,
                                font:DOCX_STYLES.font.heading,
                                size:DOCX_STYLES.sizes.chapterTitle*2,
                                color:"1A202C",
                            }),
                        ],
                        spacing:{
                            before:DOCX_STYLES.spacing.chapterBefore,
                            after:DOCX_STYLES.spacing.chapterAfter,
                        },
                    })
                );
                //chapter content
                const contentParagraphs=processMarkdowntoDocx(chapter,content||"");
                section.push(...contentParagraphs);
            }
            catch(chapterError)
            {
                console.error(`Error processing chapter ${index}:`,chapterError);
            }
        });
        //create the document
        const doc=new Document({
            sections:[
                {
                    properties:{
                        page:{
                            margin:{
                                top:1440,
                                right:1440,
                                bottom:1440,
                                left:1440,
                            },
                        },
                    },
                    children:sections,
                },
            ],
        });
        //generate the document buffer
        const buffer=await Packer.toBuffer(doc);
        //send the document
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            'Content-Disposition',
            `attachment:filename="${book.title.replace(/[^a-zA-Z0-9]/g,"_")}.docx"`
        );
        res.setHeader("Content-Length",buffer.length);
        res.send(buffer);
    }
    catch(error)
    {
        console.error("Error exporting document:",error);
        if(!res.headerSent)
        {
            res.status(500).json({message:"Server error during document export",
            error:error.message,
            });
        }
    }
};
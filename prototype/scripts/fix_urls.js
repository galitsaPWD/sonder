const fs = require('fs');

const dataFile = 'src/lib/data.ts';
let dataScript = fs.readFileSync(dataFile, 'utf8');

const placeholders = [
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop", // ceramic/vessel
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop", // sharp minimal
    "https://images.unsplash.com/photo-1618220179428-22790b46a0eb?q=80&w=800&auto=format&fit=crop", // chair
    "https://images.unsplash.com/photo-1596078841242-12f73dc697c6?q=80&w=800&auto=format&fit=crop", // light
    "https://images.unsplash.com/photo-1542488827-0ec6fc3fe80a?q=80&w=800&auto=format&fit=crop", // abstract luxury
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop", // table
    "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=800&auto=format&fit=crop", // minimal vase
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop", // perfume/glass
    "https://images.unsplash.com/photo-1605814545224-811c7512ae32?q=80&w=800&auto=format&fit=crop", // elegant fabric
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop", // watch
];

let i = 0;
dataScript = dataScript.replace(/img: "\/assets\/items\/[^"]+"/g, (match) => {
    // Keep archetype vessel the same just in case it's working
    if (match.includes("archetype-vessel")) return match;
    
    const url = placeholders[i % placeholders.length];
    i++;
    return `img: "${url}"`;
});

fs.writeFileSync(dataFile, dataScript);
console.log("Updated data.ts with working Unsplash images");

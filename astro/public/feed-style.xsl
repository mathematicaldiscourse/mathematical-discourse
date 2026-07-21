<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="/rss/channel/title" /> — RSS Feed</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: "Open Sans", system-ui, sans-serif; background: #fffaf0; color: #131313; line-height: 1.6; padding: 2rem 1.5rem; max-width: 700px; margin: 0 auto; }
          .notice { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 0.8rem; text-transform: uppercase; background: #d9ff02; display: inline-block; padding: 0.25rem 0.5rem; margin-bottom: 1.5rem; }
          h1 { font-family: "Baskervville", Georgia, serif; font-size: 2rem; font-weight: 400; margin-bottom: 0.25rem; }
          .description { margin-bottom: 2rem; color: #555; }
          .copy-url { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 0.75rem; text-transform: uppercase; background: none; border: 1px solid #131313; padding: 0.4rem 0.75rem; cursor: pointer; margin-bottom: 2.5rem; display: inline-block; }
          .copy-url:hover { background: #d9ff02; }
          .item { border-top: 1px solid #131313; padding: 1.25rem 0; }
          .item-title { font-family: "Baskervville", Georgia, serif; font-size: 1.15rem; font-weight: 400; }
          .item-title a { color: inherit; text-decoration: none; }
          .item-title a:hover { background: #d9ff02; }
          .item-date { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 0.75rem; text-transform: uppercase; color: #777; margin-top: 0.25rem; }
        </style>
      </head>
      <body>
        <p class="notice">RSS Feed</p>
        <h1><xsl:value-of select="/rss/channel/title" /></h1>
        <p class="description">Subscribe by copying the URL from your browser's address bar into your RSS reader.</p>
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <p class="item-title">
              <a>
                <xsl:attribute name="href"><xsl:value-of select="link" /></xsl:attribute>
                <xsl:value-of select="title" />
              </a>
            </p>
            <p class="item-date"><xsl:value-of select="pubDate" /></p>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

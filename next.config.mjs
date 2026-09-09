/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    // Lets a production build run against a separate build directory while
    // `next dev` is serving from .next — otherwise the build overwrites the dev
    // server's chunks out from under it and every route 500s until restart.
    //   NEXT_DIST_DIR=.next-build npm run build
    distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;

FROM emscripten/emsdk:3.1.45 as base

# Build internal emsdk zlib version
RUN embuilder build zlib

# Create prefix
WORKDIR /opt/build
WORKDIR /src

ENV ENVIRONMENT=node

# --

FROM base as mbedtls

# Download & de-compress
RUN curl -fsSL https://github.com/Mbed-TLS/mbedtls/archive/refs/tags/v3.4.1.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Fix bug with newer compilers due to missing \emptydescription
RUN find . -type f \( -name '*.c' -o -name '*.h' \) -exec \
	sed -i -e 's/\(\\retval\s\{1,\}#[A-Z_]\{1,\}\)$/\1 \\emptydescription/g' {} +

# Compile & install
WORKDIR /src/build
RUN emcmake cmake \
	-DCMAKE_SYSROOT=/emsdk/upstream/emscripten/cache/sysroot \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INSTALL_PREFIX=/opt/build \
	-DCMAKE_PREFIX_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_FIND_ROOT_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DENABLE_TESTING=Off \
	-DENABLE_PROGRAMS=Off \
	..
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as lz4

# Download & de-compress
RUN curl -fsSL https://github.com/lz4/lz4/archive/refs/tags/v1.9.4.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Compile & install
WORKDIR /src/build/cmake/build
RUN emcmake cmake \
	-DCMAKE_SYSROOT=/emsdk/upstream/emscripten/cache/sysroot \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INSTALL_PREFIX=/opt/build \
	-DCMAKE_PREFIX_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_FIND_ROOT_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DLZ4_BUILD_CLI=Off \
	..
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as lzo

# Download & de-compress
RUN curl -fsSL https://www.oberhumer.com/opensource/lzo/download/lzo-2.10.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Compile & install
WORKDIR /src/build
RUN emcmake cmake \
	-DCMAKE_SYSROOT=/emsdk/upstream/emscripten/cache/sysroot \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INSTALL_PREFIX=/opt/build \
	-DCMAKE_PREFIX_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_FIND_ROOT_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	..
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as lzma

# Download & de-compress
RUN curl -fsSL https://github.com/tukaani-project/xz/releases/download/v5.4.4/xz-5.4.4.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Patch out big endian test, it sometimes fails for no reason and WebASM is always little endian
RUN sed -i -e 's/test_big_endian(WORDS_BIGENDIAN)/set(WORDS_BIGENDIAN OFF)/g' cmake/tuklib_integer.cmake

# Compile & install
WORKDIR /src/build
# Note: DENABLE_THREADS=OFF must be uppercase
RUN emcmake cmake \
	-DCMAKE_SYSROOT=/emsdk/upstream/emscripten/cache/sysroot \
	-DCMAKE_BUILD_TYPE=Release \
	-DCMAKE_SKIP_INSTALL_ALL_DEPENDENCY=On \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INSTALL_PREFIX=/opt/build \
	-DCMAKE_PREFIX_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_FIND_ROOT_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DHAVE_POSIX_SPAWN=0 -DHAVE_PTHREAD_H=0 -DHAVE_LIBPTHREAD=0 -DPTHREAD_IN_LIBC=0 -DHAVE_POSIX_SPAWNP=0 \
	-DWORDS_BIGENDIAN=0 \
	-DENABLE_THREADS=OFF \
	-DBUILD_SHARED_LIBS=Off \
	-DCREATE_XZ_SYMLINKS=Off \
	-DCREATE_LZMA_SYMLINKS=Off \
	..
# Only build liblzma, because the xz utilities are not compatible with WebASM yet
RUN emmake make -j$(nproc) liblzma
# Work-around make install requiring this files to exist to not fail
RUN touch xzdec.js xz.js
RUN emmake make install

# --

FROM base as zstd

# Download & de-compress
RUN curl -fsSL https://github.com/facebook/zstd/releases/download/v1.5.5/zstd-1.5.5.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Compile & install
WORKDIR /src/build/cmake/build
RUN emcmake cmake \
	-DCMAKE_SYSROOT=/emsdk/upstream/emscripten/cache/sysroot \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INSTALL_PREFIX=/opt/build \
	-DCMAKE_PREFIX_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_FIND_ROOT_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DZSTD_BUILD_TESTS=Off \
	-DZSTD_BUILD_STATIC=On \
	-DZSTD_BUILD_SHARED=Off \
	-DZSTD_BUILD_CONTRIB=Off \
	-DZSTD_BUILD_PROGRAMS=Off \
	-DZSTD_MULTITHREAD_SUPPORT=Off \
	..
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as bzip

# Download & de-compress
RUN curl -fsSL https://github.com/libarchive/bzip2/archive/1ea1ac188ad4b9cb662e3f8314673c63df95a589.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Compile & install
WORKDIR /src/build
RUN emcmake cmake \
	-DCMAKE_SYSROOT=/emsdk/upstream/emscripten/cache/sysroot \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INSTALL_PREFIX=/opt/build \
	-DCMAKE_PREFIX_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_FIND_ROOT_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DENABLE_APP=Off \
	-DENABLE_DOCS=Off \
	-DUSE_OLD_SONAME=On \
	-DENABLE_EXAMPLES=Off \
	-DENABLE_STATIC_LIB=On \
	-DENABLE_SHARED_LIB=Off \
	..
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as libarchive

# Download & de-compress
RUN curl -fsSL https://github.com/libarchive/libarchive/releases/download/v3.7.2/libarchive-3.7.2.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Patch to disable grzip and lrzip
COPY ./remove_support_for_external_programs.patch ./
RUN patch -p1 -i remove_support_for_external_programs.patch

# Copy compiled dependencies
COPY --from=mbedtls /opt/build /opt/build
COPY --from=lz4 /opt/build /opt/build
COPY --from=lzo /opt/build /opt/build
COPY --from=lzma /opt/build /opt/build
COPY --from=zstd /opt/build /opt/build
COPY --from=bzip /opt/build /opt/build

# Compile & install
WORKDIR /src/_build
RUN emcmake cmake \
	-DCMAKE_SYSROOT=/emsdk/upstream/emscripten/cache/sysroot \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INSTALL_PREFIX=/opt/build \
	-DCMAKE_PREFIX_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_FIND_ROOT_PATH='/opt/build;/emsdk/upstream/emscripten/cache/sysroot' \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DHAVE_POSIX_SPAWN=0 -DHAVE_PTHREAD_H=0 -DHAVE_LIBPTHREAD=0 -DPTHREAD_IN_LIBC=0 -DHAVE_POSIX_SPAWNP=0 \
	-DHAVE_VFORK=0 -DHAVE_FORK=0 \
	-DENABLE_MBEDTLS=On \
	-DMBEDTLS_LIBRARY=/opt/build/lib/libmbedtls.a \
	-DMBEDX509_LIBRARY=/opt/build/lib/libmbedx509.a \
	-DMBEDCRYPTO_LIBRARY=/opt/build/lib/libmbedcrypto.a \
	-DENABLE_NETTLE=Off \
	-DENABLE_OPENSSL=Off \
	-DENABLE_LIBB2=Off \
	-DENABLE_LZ4=On \
	-DENABLE_LZO=On \
	-DENABLE_LZMA=On \
	-DENABLE_ZSTD=On \
	-DENABLE_ZLIB=On \
	-DENABLE_BZip2=On \
	-DBZIP2_LIBRARIES=/opt/build/lib/libbz2_static.a \
	-DENABLE_LIBXML2=Off \
	-DENABLE_EXPAT=Off \
	-DENABLE_PCREPOSIX=Off \
	-DENABLE_LIBGCC=Off \
	-DENABLE_CNG=Off \
	-DENABLE_TAR=Off \
	-DENABLE_CPIO=Off \
	-DENABLE_CAT=Off \
	-DENABLE_UNZIP=Off \
	-DENABLE_XATTR=Off \
	-DENABLE_ACL=Off \
	-DENABLE_ICONV=Off \
	-DENABLE_TEST=Off \
	-DPOSIX_REGEX_LIB=libc \
	..
RUN emmake make -j$(nproc) 2>&1
RUN emmake make install

# --
FROM base as wrapper

# Copy wrapper source and config
COPY ./wrapper.c ./
COPY ./lib.exports ./

# Copy compiled dependencies
COPY --from=libarchive /opt/build /opt/build

# Compile
RUN emcc -c ./wrapper.c -I /opt/build/include -I /emsdk/upstream/emscripten/cache/sysroot/include
RUN mkdir out
RUN emcc ./wrapper.o \
	/opt/build/lib/libarchive.a \
	/opt/build/lib/liblz4.a \
	/opt/build/lib/liblzo2.a \
	/opt/build/lib/liblzma.a \
	/opt/build/lib/libzstd.a \
	/opt/build/lib/libmbedtls.a \
	/opt/build/lib/libmbedx509.a \
	/opt/build/lib/libmbedcrypto.a \
	/opt/build/lib/libbz2_static.a \
	-o ./out/libarchive.mjs -Oz -flto \
	-s WASM=1 \
	-s STRICT=1 \
	-s USE_ZLIB=1 \
	-s FILESYSTEM=0 \
	-s STANDALONE_WASM=1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORTED_FUNCTIONS=@$PWD/lib.exports \
	-s EXPORTED_RUNTIME_METHODS=cwrap \
	--minify=0 \
	--no-entry \
	--strip-all

# --

FROM base as format

ENV DENO_INSTALL=/usr/local

RUN curl -fsSL https://deno.land/x/install/install.sh | sh

COPY --from=wrapper /src/out /wasm

RUN deno fmt /wasm/libarchive.mjs

# --

FROM scratch

COPY --from=format /wasm /wasm

# syntax=docker/dockerfile:1

ARG SYSROOT='/emsdk/upstream/emscripten/cache/sysroot'

FROM emscripten/emsdk:3.1.46 as base

SHELL ["/bin/bash", "-euxc"]

RUN apt-get update -y && apt-get install -y pkg-config

# Change emscripten default compilation configs
COPY settings.sh /settings.sh
RUN /settings.sh

ENV CFLAGS='-r -Oz -flto -fpic -fwasm-exceptions --minify=0 --closure=0 --no-entry'
ENV CXXFLAGS="$CFLAGS"

WORKDIR /src

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
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_POSITION_INDEPENDENT_CODE=On \
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
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_POSITION_INDEPENDENT_CODE=On \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DLZ4_BUILD_CLI=Off \
	-DLZ4_BUILD_LEGACY_LZ4C=Off \
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
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_POSITION_INDEPENDENT_CODE=On \
	-DCMAKE_SKIP_INSTALL_ALL_DEPENDENCY=On \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	..
RUN emmake make -j$(nproc) lzo_static_lib
RUN touch lzopack.js lzotest.js simple.js testmini.js
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
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_POSITION_INDEPENDENT_CODE=On \
	-DCMAKE_SKIP_INSTALL_ALL_DEPENDENCY=On \
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
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_POSITION_INDEPENDENT_CODE=On \
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
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_POSITION_INDEPENDENT_CODE=On \
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

ARG SYSROOT

# Download & de-compress
RUN curl -fsSL https://github.com/libarchive/libarchive/releases/download/v3.7.2/libarchive-3.7.2.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Patch to disable grzip and lrzip
COPY ./remove_support_for_external_programs.patch ./
RUN patch -p1 -i remove_support_for_external_programs.patch

# Build internal emsdk zlib version
RUN embuilder --lto --pic build zlib

# Copy compiled dependencies
COPY --from=mbedtls $SYSROOT $SYSROOT
COPY --from=lz4 $SYSROOT $SYSROOT
COPY --from=lzo $SYSROOT $SYSROOT
COPY --from=lzma $SYSROOT $SYSROOT
COPY --from=zstd $SYSROOT $SYSROOT
COPY --from=bzip $SYSROOT $SYSROOT

# Compile & install
WORKDIR /src/_build
ENV CFLAGS="$CFLAGS -DARCHIVE_ERRNO_PROGRAMMER_ERROR=-3 -DARCHIVE_ERRNO_FILE_FORMAT=-2 -DARCHIVE_ERRNO_MISC=-1"
RUN emcmake cmake \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_POSITION_INDEPENDENT_CODE=On \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DHAVE_POSIX_SPAWN=0 -DHAVE_PTHREAD_H=0 -DHAVE_LIBPTHREAD=0 -DPTHREAD_IN_LIBC=0 -DHAVE_POSIX_SPAWNP=0 \
	-DHAVE_VFORK=0 -DHAVE_FORK=0 -DHAVE__FSEEKI64=0 \
	-DHAVE_WCSCPY=1 -DHAVE_WCSLEN=1 \
	-DENABLE_MBEDTLS=On \
	-DENABLE_NETTLE=Off \
	-DENABLE_OPENSSL=Off \
	-DENABLE_LIBB2=Off \
	-DENABLE_LZ4=On \
	-DENABLE_LZO=On \
	-DENABLE_LZMA=On \
	-DENABLE_ZSTD=On \
	-DENABLE_ZLIB=On \
	-DZLIB_LIBRARY=${SYSROOT}/lib/wasm64-emscripten/lto-pic/libz.a \
	-DENABLE_BZip2=On \
	-DBZIP2_LIBRARIES=${SYSROOT}/lib/libbz2_static.a \
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
	-DLIBARCHIVE_STATIC=1 \
	..
RUN emmake make -j$(nproc) 2>&1
RUN emmake make install

# --

FROM base as wrapper

ARG SYSROOT

# Copy wrapper source and config
COPY ./wrapper.c ./
COPY ./lib.exports ./

# Copy compiled dependencies
COPY --from=libarchive $SYSROOT $SYSROOT

# Compile
ENV EMCC_CFLAGS='-DLIBARCHIVE_STATIC'
RUN emcc -c ./wrapper.c -I "${SYSROOT}/include" $CFLAGS
RUN mkdir wasm
RUN printf "\n// @ts-nocheck\n" >pre.js
RUN printf "\nexport const wasm = await wasmFactory()\n" >post.js
RUN emcc ./wrapper.o \
	"${SYSROOT}/lib/libarchive.a" \
	"${SYSROOT}/lib/liblz4.a" \
	"${SYSROOT}/lib/liblzo2.a" \
	"${SYSROOT}/lib/liblzma.a" \
	"${SYSROOT}/lib/libzstd.a" \
	"${SYSROOT}/lib/libmbedtls.a" \
	"${SYSROOT}/lib/libmbedx509.a" \
	"${SYSROOT}/lib/libmbedcrypto.a" \
	"${SYSROOT}/lib/libbz2_static.a" \
	-o ./wasm/libarchive.mjs $CFLAGS --lto --pic --strip-all --extern-pre-js=/src/pre.js --extern-post-js=/src/post.js \
	-s USE_ZLIB=1 \
	-s POLYFILL=0 \
	-s EXPORT_ES6=1 \
	-s INVOKE_RUN=0 \
	-s MODULARIZE=1 \
	-s TEXTDECODER=1 \
	-s EXPORT_NAME=wasmFactory \
	-s EXPORTED_FUNCTIONS=@/src/lib.exports \
	-s EMIT_PRODUCERS_SECTION=1 \
	-s EMIT_EMSCRIPTEN_LICENSE=1 \
	-s EXPORTED_RUNTIME_METHODS=cwrap,ccall

# --

FROM scratch

COPY --from=wrapper /src/wasm /wasm

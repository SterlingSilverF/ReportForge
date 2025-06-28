# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Install Node.js for React build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy project file for dependency caching
COPY *.csproj .

# Clear ALL NuGet caches and force clean restore
RUN dotnet nuget locals all --clear
RUN rm -rf obj/ bin/ ~/.nuget/packages/
ENV NUGET_PACKAGES=/tmp/nuget-packages
RUN dotnet restore --no-cache --verbosity minimal

# Copy everything and build
COPY . .

# Build React app first
WORKDIR /app/ClientApp
RUN npm ci --only=production
RUN npm run build

# Build .NET app with completely clean environment
WORKDIR /app
RUN rm -rf obj/ bin/
RUN dotnet build -c Release --no-restore
RUN dotnet publish -c Release -o out --no-build

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Railway configuration
EXPOSE $PORT
ENV ASPNETCORE_URLS=http://*:$PORT

ENTRYPOINT ["dotnet", "ReportManager.dll"]
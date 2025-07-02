# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Install Node.js for React build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy project files
COPY *.csproj .
COPY . .

# Build React app
WORKDIR /app/ClientApp
RUN npm ci --only=production
RUN npm run build

# Clean build .NET app (this clears Windows artifacts)
WORKDIR /app
RUN dotnet clean
RUN dotnet publish -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Railway config & launch
EXPOSE 8080
ENV PORT=8080
ENV ASPNETCORE_URLS=http://*:8080
ENTRYPOINT ["dotnet", "ReportManager.dll"]
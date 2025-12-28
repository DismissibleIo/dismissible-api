-- CreateTable
CREATE TABLE "dismissible_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissed_at" TIMESTAMP(3),

    CONSTRAINT "dismissible_items_pkey" PRIMARY KEY ("user_id","id")
);

-- CreateIndex
CREATE INDEX "dismissible_items_user_id_idx" ON "dismissible_items"("user_id");
